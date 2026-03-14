from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assets.models import Unit
from core.models import AuditLog
from personnel.access import GroupName, assign_role_group, ensure_role_groups
from personnel.models import Person
from records.models import FilmRecord


User = get_user_model()


class AuditLogTests(TestCase):
    def setUp(self):
        ensure_role_groups()
        self.client = APIClient()
        self.unit = Unit.objects.create(name="Aeroparque", code="AEP")
        self.admin_user, self.admin_person = self._create_role_user(
            username="audit_admin",
            badge_number="880001",
            role=Person.ROLE_ADMIN,
        )
        self.operator_user, self.operator_person = self._create_role_user(
            username="audit_operator",
            badge_number="880002",
            role=Person.ROLE_OPERADOR,
        )
        self.crev_user, self.crev_person = self._create_role_user(
            username="audit_crev",
            badge_number="880003",
            role=Person.ROLE_CREV,
        )
        self.read_only_user = User.objects.create_user(username="audit_read_only", password="Temp123456!")
        assign_role_group(self.read_only_user, GroupName.READ_ONLY)

    def _create_role_user(self, *, username, badge_number, role):
        user = User.objects.create_user(username=username, password="Temp123456!")
        person = Person.objects.create(
            first_name=username,
            last_name="Test",
            badge_number=badge_number,
            role=role,
            rank="CIVIL",
            unit=self.unit,
            user=user,
        )
        assign_role_group(user, role)
        return user, person

    def test_login_success_and_failure_are_logged(self):
        success_response = self.client.post(
            "/api/auth/login/",
            {"username": self.operator_user.username, "password": "Temp123456!"},
            format="json",
        )
        self.assertEqual(success_response.status_code, 200)

        success_log = AuditLog.objects.filter(action="login").order_by("-id").first()
        self.assertIsNotNone(success_log)
        self.assertEqual(success_log.actor, self.operator_user)
        self.assertEqual(success_log.username, self.operator_user.username)
        self.assertEqual(success_log.status_code, 200)
        self.assertEqual(success_log.metadata["request_payload"]["password"], "***")

        failure_response = self.client.post(
            "/api/auth/login/",
            {"username": self.operator_user.username, "password": "incorrecta"},
            format="json",
        )
        self.assertGreaterEqual(failure_response.status_code, 400)

        failure_log = AuditLog.objects.filter(action="login").order_by("-id").first()
        self.assertEqual(failure_log.username, self.operator_user.username)
        self.assertIsNone(failure_log.actor)
        self.assertEqual(failure_log.status_code, failure_response.status_code)
        self.assertEqual(failure_log.message, "Intento de login fallido")

    def test_read_and_create_requests_are_logged(self):
        self.client.force_authenticate(self.admin_user)

        list_response = self.client.get("/api/people/")
        self.assertEqual(list_response.status_code, 200)

        list_log = AuditLog.objects.filter(path="/api/people/", method="GET").order_by("-id").first()
        self.assertIsNotNone(list_log)
        self.assertEqual(list_log.action, "read")
        self.assertEqual(list_log.actor, self.admin_user)
        self.assertEqual(list_log.target_model, "person")

        create_response = self.client.post(
            "/api/people/",
            {
                "first_name": "Laura",
                "last_name": "Auditada",
                "badge_number": "880099",
                "role": Person.ROLE_OPERADOR,
                "rank": "CIVIL",
                "unit": self.unit.code,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)

        create_log = AuditLog.objects.filter(path="/api/people/", method="POST").order_by("-id").first()
        self.assertIsNotNone(create_log)
        self.assertEqual(create_log.action, "create")
        self.assertEqual(create_log.actor, self.admin_user)
        self.assertEqual(create_log.target_model, "person")
        self.assertEqual(create_log.target_id, str(create_response.data["id"]))
        self.assertEqual(create_log.metadata["request_payload"]["badge_number"], "880099")

    def test_verify_by_crev_uses_custom_audit_action(self):
        record = FilmRecord.objects.create(
            generator_unit=self.unit,
            entry_date=timezone.localdate(),
            has_backup=True,
            backup_path="//evidence/clip.mp4",
            file_hash="abc123",
            hash_algorithm="sha256",
            operator="Operador, Test",
        )

        self.client.force_authenticate(self.crev_user)
        response = self.client.post(
            f"/api/film-records/{record.id}/verify_by_crev/",
            {"observations": "verificado"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        log_entry = AuditLog.objects.filter(action="verify_by_crev").order_by("-id").first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.actor, self.crev_user)
        self.assertEqual(log_entry.target_model, "filmrecord")
        self.assertEqual(log_entry.target_id, str(record.id))
        self.assertEqual(log_entry.changes["verified_by_crev_id"], self.crev_person.id)

    def test_audit_log_endpoint_requires_admin_role(self):
        AuditLog.objects.create(
            actor=self.admin_user,
            username=self.admin_user.username,
            role=Person.ROLE_ADMIN,
            action="seed",
            method="POST",
            status_code=200,
            path="/api/internal/seed/",
            route_name="internal-seed",
            message="Entrada de prueba",
        )

        self.client.force_authenticate(self.admin_user)
        admin_response = self.client.get("/api/audit-logs/")
        self.assertEqual(admin_response.status_code, 200)
        self.assertGreaterEqual(admin_response.data["count"], 1)

        self.client.force_authenticate(self.operator_user)
        operator_response = self.client.get("/api/audit-logs/")
        self.assertEqual(operator_response.status_code, 403)
