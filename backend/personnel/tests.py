import os

from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from assets.models import Unit
from personnel.access import GroupName, assign_role_group, ensure_role_groups
from personnel.management.commands.seed_system_users import Command as SeedSystemUsersCommand
from personnel.models import Person, UserAccountProfile
from records.models import FilmRecord


User = get_user_model()


class AuthApiTests(TestCase):
    def setUp(self):
        ensure_role_groups()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='operador_auth',
            password='Temp123456!',
            first_name='Olga',
            last_name='Operadora',
        )
        self.person = Person.objects.create(
            first_name='Olga',
            last_name='Operadora',
            badge_number='810001',
            role=Person.ROLE_OPERADOR,
            user=self.user,
        )
        assign_role_group(self.user, Person.ROLE_OPERADOR)

    def test_protected_endpoint_requires_authentication(self):
        response = self.client.get('/api/people/')

        self.assertEqual(response.status_code, 401)

    def test_login_me_and_change_password_flow(self):
        login_response = self.client.post(
            '/api/auth/login/',
            {'username': 'operador_auth', 'password': 'Temp123456!'},
            format='json',
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)
        self.assertEqual(login_response.data['user']['role'], Person.ROLE_OPERADOR)
        self.assertTrue(login_response.data['user']['must_change_password'])

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data['username'], 'operador_auth')
        self.assertEqual(me_response.data['linked_person_id'], self.person.id)

        change_response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'Temp123456!',
                'new_password': 'NuevaClave123!',
                'new_password_confirm': 'NuevaClave123!',
            },
            format='json',
        )

        self.assertEqual(change_response.status_code, 200)
        self.assertFalse(change_response.data['user']['must_change_password'])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NuevaClave123!'))

        profile = UserAccountProfile.objects.get(user=self.user)
        self.assertFalse(profile.must_change_password)


class RolePermissionApiTests(TestCase):
    def setUp(self):
        ensure_role_groups()
        self.client = APIClient()
        self.unit = Unit.objects.create(name='Aeroparque', code='AEP')
        self.coord_coc_user, self.coord_coc_person = self._create_role_user(
            username='coord_coc',
            badge_number='810010',
            role=Person.ROLE_COORDINADOR_COC,
        )
        self.operador_user, self.operador_person = self._create_role_user(
            username='operador_role',
            badge_number='810011',
            role=Person.ROLE_OPERADOR,
        )
        self.crev_user, self.crev_person = self._create_role_user(
            username='crev_role',
            badge_number='810012',
            role=Person.ROLE_CREV,
        )
        self.read_only_user = User.objects.create_user(username='generico_role', password='Temp123456!')
        assign_role_group(self.read_only_user, GroupName.READ_ONLY)

    def _create_role_user(self, *, username, badge_number, role):
        user = User.objects.create_user(username=username, password='Temp123456!')
        person = Person.objects.create(
            first_name=username,
            last_name='Test',
            badge_number=badge_number,
            role=role,
            user=user,
            unit=self.unit,
        )
        assign_role_group(user, role)
        UserAccountProfile.objects.filter(user=user).update(must_change_password=False)
        return user, person

    def _authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_read_only_user_can_view_people_but_cannot_create_hechos(self):
        self._authenticate(self.read_only_user)

        list_response = self.client.get('/api/people/')
        create_response = self.client.post(
            '/api/hechos/',
            {
                'timestamp': timezone.now().isoformat(),
                'description': 'Hecho bloqueado',
                'category': 'OPERATIVO',
            },
            format='json',
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(create_response.status_code, 403)

    def test_coordinador_coc_can_manage_assets_and_personnel(self):
        self._authenticate(self.coord_coc_user)

        system_response = self.client.post(
            '/api/systems/',
            {
                'name': 'Sistema Coordinacion',
                'unit_id': self.unit.id,
            },
            format='json',
        )
        personnel_response = self.client.post(
            '/api/people/',
            {
                'first_name': 'Laura',
                'last_name': 'Alta',
                'badge_number': '810099',
                'role': Person.ROLE_OPERADOR,
                'rank': 'CIVIL',
                'unit': self.unit.code,
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(system_response.status_code, 201)
        self.assertEqual(personnel_response.status_code, 201)

    def test_verify_by_crev_rejects_operador_and_accepts_crev_user(self):
        record = FilmRecord.objects.create(
            generator_unit=self.unit,
            entry_date=timezone.localdate(),
            has_backup=True,
            backup_path='//evidence/clip.mp4',
            file_hash='abc123',
            hash_algorithm='sha256',
            operator='Operador, Test',
        )

        self._authenticate(self.operador_user)
        forbidden_response = self.client.post(
            f'/api/film-records/{record.id}/verify_by_crev/',
            {'verified_by': self.operador_person.id, 'observations': 'sin permiso'},
            format='json',
        )
        self.assertEqual(forbidden_response.status_code, 403)

        self._authenticate(self.crev_user)
        success_response = self.client.post(
            f'/api/film-records/{record.id}/verify_by_crev/',
            {'verified_by': self.operador_person.id, 'observations': 'verificado'},
            format='json',
        )

        self.assertEqual(success_response.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.verified_by_crev_id, self.crev_person.id)
        self.assertFalse(record.is_editable)


class SeedSystemUsersCommandTests(TestCase):
    def setUp(self):
        ensure_role_groups()
        Unit.objects.create(name='Aeroparque', code='AEP')
        Unit.objects.create(name='CREV Central', code='CREV')

    def test_seed_system_users_is_idempotent(self):
        previous_password = os.environ.get('SYSTEM_USERS_DEFAULT_PASSWORD')
        os.environ['SYSTEM_USERS_DEFAULT_PASSWORD'] = 'Temp123456!'
        try:
            call_command('seed_system_users')
            call_command('seed_system_users')
        finally:
            if previous_password is None:
                os.environ.pop('SYSTEM_USERS_DEFAULT_PASSWORD', None)
            else:
                os.environ['SYSTEM_USERS_DEFAULT_PASSWORD'] = previous_password

        usernames = set(User.objects.values_list('username', flat=True))
        self.assertEqual(len(usernames), 6)
        self.assertIn('admin', usernames)
        self.assertIn('generico_1', usernames)

        admin_user = User.objects.get(username='admin')
        generico_user = User.objects.get(username='generico_1')
        coord_coc_user = User.objects.get(username='coord_coc_1')

        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(hasattr(coord_coc_user, 'person'))
        self.assertEqual(coord_coc_user.person.role, Person.ROLE_COORDINADOR_COC)
        self.assertFalse(hasattr(generico_user, 'person'))
        self.assertTrue(UserAccountProfile.objects.get(user=admin_user).must_change_password)

    @override_settings(DEBUG=False)
    def test_seed_system_users_requires_explicit_passwords_outside_debug(self):
        previous_default_password = os.environ.pop('SYSTEM_USERS_DEFAULT_PASSWORD', None)
        previous_admin_password = os.environ.pop('SYSTEM_USER_PASSWORD_ADMIN', None)

        try:
            with self.assertRaises(ImproperlyConfigured):
                SeedSystemUsersCommand()._get_password('admin')
        finally:
            if previous_default_password is not None:
                os.environ['SYSTEM_USERS_DEFAULT_PASSWORD'] = previous_default_password
            if previous_admin_password is not None:
                os.environ['SYSTEM_USER_PASSWORD_ADMIN'] = previous_admin_password
