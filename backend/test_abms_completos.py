"""
Tests completos para todos los ABMs (Altas, Bajas, Modificaciones) de GestorCOC.
Cubre todos los endpoints CRUD de cada módulo del sistema.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class BaseABMTest(TestCase):
    """Clase base para tests de ABMs con autenticación JWT."""

    test_counter = 0

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_counter = 0

    def get_unique_id(self):
        """Genera un ID único incremental."""
        BaseABMTest.test_counter += 1
        return BaseABMTest.test_counter

    def setUp(self):
        self.client = APIClient()
        self.test_id = self.get_unique_id()
        self.admin = User.objects.create_superuser(
            username=f"admin_{self.test_id}",
            email=f"admin{self.test_id}@abmtest.com",
            password="pass123"
        )
        refresh = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class TestPersonnelABM(BaseABMTest):
    """Tests CRUD para gestión de Personal."""

    def setUp(self):
        super().setUp()
        from personnel.models import Person
        from assets.models import Unit

        self.unit = Unit.objects.create(name=f"Unidad Test {self.test_id}", code=f"T{self.test_id:03d}", airport="EZE")
        self.person_data = {
            "first_name": "Juan",
            "last_name": "Pérez",
            "badge_number": f"{self.test_id:06d}",  # Exactamente 6 dígitos
            "role": "OPERADOR",
            "rank": "CIVIL",
            "unit": self.unit.code,  # Usar code en lugar de id
            "is_active": True
        }

    def test_create_person(self):
        """Alta: Crear nuevo personal."""
        response = self.client.post("/api/people/", self.person_data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['first_name'], "Juan")

    def test_list_people(self):
        """Listar: Obtener lista de personal."""
        self.client.post("/api/people/", self.person_data, format='json')
        response = self.client.get("/api/people/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_retrieve_person(self):
        """Detalle: Obtener persona específica."""
        create_resp = self.client.post("/api/people/", self.person_data, format='json')
        person_id = create_resp.data['id']
        
        response = self.client.get(f"/api/people/{person_id}/")
        self.assertEqual(response.status_code, 200)

    def test_update_person(self):
        """Modificación: Actualizar persona completa."""
        create_resp = self.client.post("/api/people/", self.person_data, format='json')
        person_id = create_resp.data['id']
        
        update_data = {**self.person_data, "first_name": "Carlos"}
        response = self.client.put(f"/api/people/{person_id}/", update_data, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['first_name'], "Carlos")

    def test_delete_person(self):
        """Baja: Eliminar persona."""
        create_resp = self.client.post("/api/people/", self.person_data, format='json')
        person_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/people/{person_id}/")
        self.assertEqual(response.status_code, 204)


class TestExternalPersonABM(BaseABMTest):
    """Tests CRUD para Personal Externo."""

    def setUp(self):
        super().setUp()
        self.external_data = {
            "first_name": "María",
            "last_name": "Gómez",
            "dni": f"{self.test_id:08d}",  # Solo números, 8 dígitos
            "email": f"maria{self.test_id}@externo.com",
            "function": "Técnico",
            "is_active": True
        }

    def test_create_external_person(self):
        """Alta: Crear personal externo."""
        response = self.client.post("/api/external-people/", self.external_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_external_people(self):
        """Listar: Obtener lista de personal externo."""
        self.client.post("/api/external-people/", self.external_data, format='json')
        response = self.client.get("/api/external-people/")
        self.assertEqual(response.status_code, 200)

    def test_update_external_person(self):
        """Modificación: Actualizar personal externo."""
        create_resp = self.client.post("/api/external-people/", self.external_data, format='json')
        ext_id = create_resp.data['id']
        
        update_data = {**self.external_data, "function": "Supervisor"}
        response = self.client.put(f"/api/external-people/{ext_id}/", update_data, format='json')
        
        self.assertEqual(response.status_code, 200)

    def test_delete_external_person(self):
        """Baja: Eliminar personal externo."""
        create_resp = self.client.post("/api/external-people/", self.external_data, format='json')
        ext_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/external-people/{ext_id}/")
        self.assertEqual(response.status_code, 204)


class TestAssetsABM(BaseABMTest):
    """Tests CRUD para Activos."""

    def setUp(self):
        super().setUp()
        from assets.models import Unit
        self.unit = Unit.objects.create(name=f"Unidad Assets {self.test_id}", code=f"A{self.test_id:03d}", airport="EZE")

    def test_create_unit(self):
        """Alta: Crear unidad."""
        unit_data = {"name": "Nueva Unidad", "code": f"N{self.test_id:03d}", "airport": "EZE"}
        response = self.client.post("/api/units/", unit_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_units(self):
        """Listar: Obtener unidades."""
        response = self.client.get("/api/units/")
        self.assertEqual(response.status_code, 200)

    def test_update_unit(self):
        """Modificación: Actualizar unidad."""
        unit_data = {"name": "Unidad Update", "code": f"U{self.test_id:03d}", "airport": "EZE"}
        create_resp = self.client.post("/api/units/", unit_data, format='json')
        unit_id = create_resp.data['id']
        
        update_data = {**unit_data, "name": "Unidad Modificada"}
        response = self.client.put(f"/api/units/{unit_id}/", update_data, format='json')
        
        self.assertEqual(response.status_code, 200)

    def test_delete_unit(self):
        """Baja: Eliminar unidad."""
        unit_data = {"name": "Unidad Delete", "code": f"D{self.test_id:03d}", "airport": "EZE"}
        create_resp = self.client.post("/api/units/", unit_data, format='json')
        unit_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/units/{unit_id}/")
        self.assertEqual(response.status_code, 204)

    def test_create_system(self):
        """Alta: Crear sistema."""
        system_data = {
            "name": "Sistema Test",
            "system_type": "CCTV",
            "unit": self.unit.id,
            "is_active": True
        }
        response = self.client.post("/api/systems/", system_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_create_server(self):
        """Alta: Crear servidor."""
        system = self.client.post("/api/systems/", {
            "name": "Sistema Server",
            "system_type": "CCTV",
            "unit": self.unit.id,
            "is_active": True
        }, format='json')
        
        server_data = {
            "name": "Servidor Test",
            "system": system.data['id'],
            "ip_address": "192.168.1.100",
            "is_active": True
        }
        response = self.client.post("/api/servers/", server_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_create_camera(self):
        """Alta: Crear cámara."""
        system = self.client.post("/api/systems/", {
            "name": "Sistema Camera",
            "system_type": "CCTV",
            "unit": self.unit.id,
            "is_active": True
        }, format='json')
        server = self.client.post("/api/servers/", {
            "name": "Server Camera",
            "system": system.data['id'],
            "ip_address": "192.168.1.101",
            "is_active": True
        }, format='json')

        camera_data = {
            "name": "Cámara Test",
            "server": server.data['id'],
            "ip_address": "192.168.1.200",
            "status": "ONLINE"  # Choice válido
        }
        response = self.client.post("/api/cameras/", camera_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_create_cameraman_gear(self):
        """Alta: Crear equipo de camarógrafo."""
        gear_data = {
            "name": "Cámara Portátil",
            "serial_number": "SN123456",
            "condition": "GOOD",  # Choice válido
            "is_active": True
        }
        response = self.client.post("/api/cameraman-gear/", gear_data, format='json')
        self.assertEqual(response.status_code, 201)


class TestNovedadesABM(BaseABMTest):
    """Tests CRUD para Novedades."""

    def setUp(self):
        super().setUp()
        from assets.models import Unit, System, Server, Camera
        
        self.unit = Unit.objects.create(name=f"Unidad Nov {self.test_id}", code=f"N{self.test_id:03d}", airport="EZE")
        self.system = System.objects.create(name="Sistema Nov", system_type="CCTV", unit=self.unit)
        self.server = Server.objects.create(name="Server Nov", system=self.system, ip_address="192.168.1.50")
        self.camera = Camera.objects.create(name="Cámara Nov", server=self.server, ip_address="192.168.1.51", status="ACTIVA")
        
        self.novedad_data = {
            "description": "Falla en cámara",
            "status": "OPEN",
            "severity": "MEDIUM",
            "incident_type": "Técnico",
            "camera": self.camera.id
        }

    def test_create_novedad(self):
        """Alta: Crear novedad."""
        response = self.client.post("/api/novedades/", self.novedad_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_novedades(self):
        """Listar: Obtener novedades."""
        self.client.post("/api/novedades/", self.novedad_data, format='json')
        response = self.client.get("/api/novedades/")
        self.assertEqual(response.status_code, 200)

    def test_update_novedad(self):
        """Modificación: Actualizar novedad."""
        create_resp = self.client.post("/api/novedades/", self.novedad_data, format='json')
        novedad_id = create_resp.data['id']

        update_data = {**self.novedad_data, "status": "CLOSED"}  # Choice válido
        response = self.client.put(f"/api/novedades/{novedad_id}/", update_data, format='json')
        self.assertEqual(response.status_code, 200)

    def test_delete_novedad(self):
        """Baja: Eliminar novedad."""
        create_resp = self.client.post("/api/novedades/", self.novedad_data, format='json')
        novedad_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/novedades/{novedad_id}/")
        self.assertEqual(response.status_code, 204)


class TestHechosABM(BaseABMTest):
    """Tests CRUD para Hechos."""

    def setUp(self):
        super().setUp()
        from assets.models import Unit, System, Server, Camera

        self.unit = Unit.objects.create(name=f"Unidad Hechos {self.test_id}", code=f"H{self.test_id:03d}", airport="EZE")
        self.system = System.objects.create(name="Sistema Hechos", system_type="CCTV", unit=self.unit)
        self.server = Server.objects.create(name="Server Hechos", system=self.system, ip_address="192.168.1.60")
        self.camera = Camera.objects.create(name="Cámara Hechos", server=self.server, ip_address="192.168.1.61", status="ACTIVA")

        self.hecho_data = {
            "description": "Incidente registrado",
            "category": "OPERATIVO",
            "sector": "Terminal 1",
            "camera": self.camera.id,
            "is_solved": False,
            "coc_intervention": False,
            "generated_cause": False,
            "timestamp": '2024-01-15T10:30:00Z'  # Campo requerido
        }

    def test_create_hecho(self):
        """Alta: Crear hecho."""
        response = self.client.post("/api/hechos/", self.hecho_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_hechos(self):
        """Listar: Obtener hechos."""
        self.client.post("/api/hechos/", self.hecho_data, format='json')
        response = self.client.get("/api/hechos/")
        self.assertEqual(response.status_code, 200)

    def test_update_hecho(self):
        """Modificación: Actualizar hecho."""
        create_resp = self.client.post("/api/hechos/", self.hecho_data, format='json')
        hecho_id = create_resp.data['id']
        
        update_data = {**self.hecho_data, "is_solved": True}
        response = self.client.put(f"/api/hechos/{hecho_id}/", update_data, format='json')
        
        self.assertEqual(response.status_code, 200)

    def test_delete_hecho(self):
        """Baja: Eliminar hecho."""
        create_resp = self.client.post("/api/hechos/", self.hecho_data, format='json')
        hecho_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/hechos/{hecho_id}/")
        self.assertEqual(response.status_code, 204)


class TestRecordsABM(BaseABMTest):
    """Tests CRUD para Registros Fílmicos."""

    def setUp(self):
        super().setUp()
        from assets.models import Unit
        from personnel.models import Person

        self.unit = Unit.objects.create(name=f"Unidad Records {self.test_id}", code=f"R{self.test_id:03d}", airport="EZE")
        self.operator = Person.objects.create(
            first_name="Op",
            last_name="Operator",
            badge_number=f"{self.test_id:06d}",  # Exactamente 6 dígitos
            role="OPERADOR",
            unit=self.unit
        )
        
        self.record_data = {
            "dvd_number": f"D{self.test_id:05d}",
            "report_number": f"R{self.test_id:05d}",
            "operator": self.operator.id,
            "generator_unit": self.unit.id,
            "entry_date": "2024-01-15",
            "issue_number": f"I{self.test_id:05d}",
            "request_type": "OFICIO",  # Choice válido
            "request_kind": "DENUNCIA",  # Choice válido
            "delivery_status": "PENDIENTE",
            "has_backup": False,
            "is_integrity_verified": False,
            "is_editable": True
        }

    def test_create_film_record(self):
        """Alta: Crear registro fílmico."""
        # Usar choices válidos
        self.record_data['request_type'] = 'OFICIO'
        self.record_data['request_kind'] = 'DENUNCIA'
        response = self.client.post("/api/film-records/", self.record_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_film_records(self):
        """Listar: Obtener registros fílmicos."""
        self.client.post("/api/film-records/", self.record_data, format='json')
        response = self.client.get("/api/film-records/")
        self.assertEqual(response.status_code, 200)

    def test_update_film_record(self):
        """Modificación: Actualizar registro fílmico."""
        create_resp = self.client.post("/api/film-records/", self.record_data, format='json')
        record_id = create_resp.data['id']
        
        update_data = {**self.record_data, "delivery_status": "ENTREGADO"}
        response = self.client.put(f"/api/film-records/{record_id}/", update_data, format='json')
        
        self.assertEqual(response.status_code, 200)

    def test_delete_film_record(self):
        """Baja: Eliminar registro fílmico."""
        create_resp = self.client.post("/api/film-records/", self.record_data, format='json')
        record_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/film-records/{record_id}/")
        self.assertEqual(response.status_code, 204)


class TestCatalogABM(BaseABMTest):
    """Tests CRUD para Catálogos."""

    def setUp(self):
        super().setUp()
        # Catalog requiere registros asociados, creamos uno en el setUp
        from assets.models import Unit
        from personnel.models import Person

        self.unit = Unit.objects.create(name=f"Unidad Cat {self.test_id}", code=f"C{self.test_id:03d}", airport="EZE")
        self.operator = Person.objects.create(
            first_name="Op", last_name="Cat",
            badge_number=f"{100000 + self.test_id:06d}",
            role="OPERADOR", unit=self.unit
        )
        film_record_data = {
            "dvd_number": f"D{100000 + self.test_id:05d}",
            "report_number": f"R{100000 + self.test_id:05d}",
            "operator": self.operator.id,
            "generator_unit": self.unit.id,
            "entry_date": "2024-01-15",
            "issue_number": f"I{100000 + self.test_id:05d}",
            "request_type": "OFICIO",
            "request_kind": "DENUNCIA",
            "delivery_status": "PENDIENTE",
            "has_backup": False,
            "is_integrity_verified": False,
            "is_editable": True
        }
        film_resp = self.client.post("/api/film-records/", film_record_data, format='json')
        self.film_id = film_resp.data['id']

        self.catalog_data = {
            "name": f"Catálogo Test {self.test_id}",
            "records": [self.film_id]
        }

    def test_create_catalog(self):
        """Alta: Crear catálogo."""
        response = self.client.post("/api/catalogs/", self.catalog_data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_catalogs(self):
        """Listar: Obtener catálogos."""
        self.client.post("/api/catalogs/", self.catalog_data, format='json')
        response = self.client.get("/api/catalogs/")
        self.assertEqual(response.status_code, 200)

    def test_update_catalog(self):
        """Modificación: Actualizar catálogo."""
        create_resp = self.client.post("/api/catalogs/", self.catalog_data, format='json')
        catalog_id = create_resp.data['id']
        
        update_data = {**self.catalog_data, "name": "Catálogo Actualizado"}
        response = self.client.put(f"/api/catalogs/{catalog_id}/", update_data, format='json')
        
        self.assertEqual(response.status_code, 200)

    def test_delete_catalog(self):
        """Baja: Eliminar catálogo."""
        create_resp = self.client.post("/api/catalogs/", self.catalog_data, format='json')
        catalog_id = create_resp.data['id']
        
        response = self.client.delete(f"/api/catalogs/{catalog_id}/")
        self.assertEqual(response.status_code, 204)


if __name__ == '__main__':
    import unittest
    unittest.main()
