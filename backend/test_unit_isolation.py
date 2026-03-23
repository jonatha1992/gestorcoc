"""
Tests para verificar el aislamiento de datos por unidad operativa.
Verifica que:
1. Un usuario de EZEIZA no pueda ver datos de AEROPARQUES
2. Un usuario de AEROPARQUES no pueda ver datos de EZEIZA
3. Solo personal CREV/Admin pueda ver todas las unidades
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from assets.models import Unit, System, Server, Camera
from personnel.models import Person
from hechos.models import Hecho
from novedades.models import Novedad
from records.models import FilmRecord

User = get_user_model()


class UnitIsolationTest(TestCase):
    """Tests para verificar el aislamiento de datos entre unidades."""

    @classmethod
    def setUpTestData(cls):
        """Crear datos de prueba una sola vez para todas las pruebas."""
        # Crear dos unidades diferentes
        cls.unit_eze = Unit.objects.create(
            name="Ezeiza",
            code="EZE",
            airport="EZE"
        )
        cls.unit_apa = Unit.objects.create(
            name="Aeroparques",
            code="APA",
            airport="AEP"
        )
        
        # Crear sistemas en cada unidad
        cls.system_eze = System.objects.create(
            name="Sistema EZE",
            system_type="CCTV",
            unit=cls.unit_eze,
            is_active=True
        )
        cls.system_apa = System.objects.create(
            name="Sistema APA",
            system_type="CCTV",
            unit=cls.unit_apa,
            is_active=True
        )
        
        # Crear servidores
        cls.server_eze = Server.objects.create(
            name="Server EZE",
            system=cls.system_eze,
            ip_address="192.168.1.1",
            is_active=True
        )
        cls.server_apa = Server.objects.create(
            name="Server APA",
            system=cls.system_apa,
            ip_address="192.168.2.1",
            is_active=True
        )
        
        # Crear cámaras
        cls.camera_eze = Camera.objects.create(
            name="Cámara EZE",
            server=cls.server_eze,
            ip_address="192.168.1.10",
            status="ONLINE"
        )
        cls.camera_apa = Camera.objects.create(
            name="Cámara APA",
            server=cls.server_apa,
            ip_address="192.168.2.10",
            status="ONLINE"
        )
        
        # Crear personal de cada unidad
        cls.person_eze = Person.objects.create(
            first_name="Juan",
            last_name="Ezeiza",
            badge_number="000001",
            role="OPERADOR",
            rank="CIVIL",
            unit=cls.unit_eze,
            is_active=True
        )
        cls.person_apa = Person.objects.create(
            first_name="Pedro",
            last_name="Aeroparques",
            badge_number="000002",
            role="OPERADOR",
            rank="CIVIL",
            unit=cls.unit_apa,
            is_active=True
        )
        
        # Crear usuario CREV (puede ver todo)
        cls.person_crev = Person.objects.create(
            first_name="Carlos",
            last_name="CREV",
            badge_number="000003",
            role="CREV",
            rank="CIVIL",
            unit=cls.unit_eze,  # Aunque está asignado a EZE, puede ver todo
            is_active=True
        )
        
        # Crear Hechos en cada unidad
        cls.hecho_eze = Hecho.objects.create(
            description="Hecho en EZE",
            category="OPERATIVO",
            sector="Terminal",
            camera=cls.camera_eze,
            timestamp="2024-01-15T10:00:00Z"
        )
        cls.hecho_apa = Hecho.objects.create(
            description="Hecho en APA",
            category="OPERATIVO",
            sector="Terminal",
            camera=cls.camera_apa,
            timestamp="2024-01-15T11:00:00Z"
        )
        
        # Crear Novedades en cada unidad
        cls.novedad_eze = Novedad.objects.create(
            description="Novedad en EZE",
            status="OPEN",
            severity="MEDIUM",
            incident_type="Técnico",
            camera=cls.camera_eze
        )
        cls.novedad_apa = Novedad.objects.create(
            description="Novedad en APA",
            status="OPEN",
            severity="MEDIUM",
            incident_type="Técnico",
            camera=cls.camera_apa
        )
        
        # Crear FilmRecords en cada unidad
        cls.record_eze = FilmRecord.objects.create(
            dvd_number="D000001",
            report_number="R000001",
            operator=cls.person_eze,
            generator_unit=cls.unit_eze,
            entry_date="2024-01-15",
            issue_number="I000001",
            request_type="OFICIO",
            request_kind="DENUNCIA",
            delivery_status="PENDIENTE"
        )
        cls.record_apa = FilmRecord.objects.create(
            dvd_number="D000002",
            report_number="R000002",
            operator=cls.person_apa,
            generator_unit=cls.unit_apa,
            entry_date="2024-01-15",
            issue_number="I000002",
            request_type="OFICIO",
            request_kind="DENUNCIA",
            delivery_status="PENDIENTE"
        )

    def get_client_for_person(self, person):
        """Crear un cliente API autenticado para una persona."""
        user = User.objects.create_user(
            username=f"user_{person.badge_number}",
            email=f"{person.badge_number}@test.com",
            password="pass123"
        )
        person.user = user
        person.save()
        
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client

    def test_ezeiza_cannot_see_aeroparques_systems(self):
        """Un usuario de EZEIZA no debe poder ver sistemas de AEROPARQUES."""
        client = self.get_client_for_person(self.person_eze)
        
        response = client.get("/api/systems/")
        self.assertEqual(response.status_code, 200)
        
        # Debe ver solo el sistema de EZE
        systems = response.data['results']
        system_ids = [s['id'] for s in systems]
        
        self.assertIn(self.system_eze.id, system_ids, "Debe ver su propio sistema")
        self.assertNotIn(self.system_apa.id, system_ids, "NO debe ver sistema de otra unidad")

    def test_aeroparques_cannot_see_ezeiza_systems(self):
        """Un usuario de AEROPARQUES no debe poder ver sistemas de EZEIZA."""
        client = self.get_client_for_person(self.person_apa)
        
        response = client.get("/api/systems/")
        self.assertEqual(response.status_code, 200)
        
        systems = response.data['results']
        system_ids = [s['id'] for s in systems]
        
        self.assertIn(self.system_apa.id, system_ids, "Debe ver su propio sistema")
        self.assertNotIn(self.system_eze.id, system_ids, "NO debe ver sistema de otra unidad")

    def test_crev_can_see_all_systems(self):
        """Un usuario CREV debe poder ver sistemas de todas las unidades."""
        client = self.get_client_for_person(self.person_crev)
        
        response = client.get("/api/systems/")
        self.assertEqual(response.status_code, 200)
        
        systems = response.data['results']
        system_ids = [s['id'] for s in systems]
        
        self.assertIn(self.system_eze.id, system_ids, "CREV debe ver sistema de EZE")
        self.assertIn(self.system_apa.id, system_ids, "CREV debe ver sistema de APA")

    def test_ezeiza_cannot_see_aeroparques_cameras(self):
        """Un usuario de EZEIZA no debe poder ver cámaras de AEROPARQUES."""
        client = self.get_client_for_person(self.person_eze)
        
        response = client.get("/api/cameras/")
        self.assertEqual(response.status_code, 200)
        
        cameras = response.data['results']
        camera_ids = [c['id'] for c in cameras]
        
        self.assertIn(self.camera_eze.id, camera_ids, "Debe ver su propia cámara")
        self.assertNotIn(self.camera_apa.id, camera_ids, "NO debe ver cámara de otra unidad")

    def test_crev_can_see_all_cameras(self):
        """Un usuario CREV debe poder ver cámaras de todas las unidades."""
        client = self.get_client_for_person(self.person_crev)
        
        response = client.get("/api/cameras/")
        self.assertEqual(response.status_code, 200)
        
        cameras = response.data['results']
        camera_ids = [c['id'] for c in cameras]
        
        self.assertIn(self.camera_eze.id, camera_ids, "CREV debe ver cámara de EZE")
        self.assertIn(self.camera_apa.id, camera_ids, "CREV debe ver cámara de APA")

    def test_ezeiza_cannot_see_aeroparques_hechos(self):
        """Un usuario de EZEIZA no debe poder ver hechos de AEROPARQUES."""
        client = self.get_client_for_person(self.person_eze)
        
        response = client.get("/api/hechos/")
        self.assertEqual(response.status_code, 200)
        
        hechos = response.data['results']
        hecho_ids = [h['id'] for h in hechos]
        
        self.assertIn(self.hecho_eze.id, hecho_ids, "Debe ver su propio hecho")
        self.assertNotIn(self.hecho_apa.id, hecho_ids, "NO debe ver hecho de otra unidad")

    def test_crev_can_see_all_hechos(self):
        """Un usuario CREV debe poder ver hechos de todas las unidades."""
        client = self.get_client_for_person(self.person_crev)
        
        response = client.get("/api/hechos/")
        self.assertEqual(response.status_code, 200)
        
        hechos = response.data['results']
        hecho_ids = [h['id'] for h in hechos]
        
        self.assertIn(self.hecho_eze.id, hecho_ids, "CREV debe ver hecho de EZE")
        self.assertIn(self.hecho_apa.id, hecho_ids, "CREV debe ver hecho de APA")

    def test_ezeiza_cannot_see_aeroparques_novedades(self):
        """Un usuario de EZEIZA no debe poder ver novedades de AEROPARQUES."""
        client = self.get_client_for_person(self.person_eze)
        
        response = client.get("/api/novedades/")
        self.assertEqual(response.status_code, 200)
        
        novedades = response.data['results']
        novedad_ids = [n['id'] for n in novedades]
        
        self.assertIn(self.novedad_eze.id, novedad_ids, "Debe ver su propia novedad")
        self.assertNotIn(self.novedad_apa.id, novedad_ids, "NO debe ver novedad de otra unidad")

    def test_crev_can_see_all_novedades(self):
        """Un usuario CREV debe poder ver novedades de todas las unidades."""
        client = self.get_client_for_person(self.person_crev)
        
        response = client.get("/api/novedades/")
        self.assertEqual(response.status_code, 200)
        
        novedades = response.data['results']
        novedad_ids = [n['id'] for n in novedades]
        
        self.assertIn(self.novedad_eze.id, novedad_ids, "CREV debe ver novedad de EZE")
        self.assertIn(self.novedad_apa.id, novedad_ids, "CREV debe ver novedad de APA")

    def test_ezeiza_cannot_see_aeroparques_records(self):
        """Un usuario de EZEIZA no debe poder ver registros de AEROPARQUES."""
        client = self.get_client_for_person(self.person_eze)
        
        response = client.get("/api/film-records/")
        self.assertEqual(response.status_code, 200)
        
        records = response.data['results']
        record_ids = [r['id'] for r in records]
        
        self.assertIn(self.record_eze.id, record_ids, "Debe ver su propio registro")
        self.assertNotIn(self.record_apa.id, record_ids, "NO debe ver registro de otra unidad")

    def test_crev_can_see_all_records(self):
        """Un usuario CREV debe poder ver registros de todas las unidades."""
        client = self.get_client_for_person(self.person_crev)
        
        response = client.get("/api/film-records/")
        self.assertEqual(response.status_code, 200)
        
        records = response.data['results']
        record_ids = [r['id'] for r in records]
        
        self.assertIn(self.record_eze.id, record_ids, "CREV debe ver registro de EZE")
        self.assertIn(self.record_apa.id, record_ids, "CREV debe ver registro de APA")

    def test_admin_can_see_all_units(self):
        """Un admin debe poder ver sistemas de todas las unidades."""
        admin_user = User.objects.create_superuser(
            username="admin_isolation_test",
            email="admin@test.com",
            password="pass123"
        )
        client = APIClient()
        refresh = RefreshToken.for_user(admin_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = client.get("/api/systems/")
        self.assertEqual(response.status_code, 200)
        
        systems = response.data['results']
        system_ids = [s['id'] for s in systems]
        
        self.assertIn(self.system_eze.id, system_ids, "Admin debe ver sistema de EZE")
        self.assertIn(self.system_apa.id, system_ids, "Admin debe ver sistema de APA")


if __name__ == '__main__':
    import unittest
    unittest.main()
