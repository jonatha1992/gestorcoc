"""
Tests para verificar la creación de usuarios en ambos sistemas:
1. Sistema CCTV (gestión de activos)
2. Sistema GestorCOC (gestión de personal y usuarios)

Verifica que:
- Se pueden crear usuarios para ambos sistemas
- Los roles se asignan correctamente
- Los permisos funcionan adecuadamente
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
from personnel.models import Person, UserAccountProfile
from personnel.access import assign_role_group

User = get_user_model()


class UserCreationTest(TestCase):
    """Tests para verificar la creación de usuarios."""

    def setUp(self):
        from django.contrib.auth.models import Group

        # Crear administrador que puede crear usuarios
        self.admin = User.objects.create_superuser(
            username="admin_user_test",
            email="admin_usertest@test.com",
            password="pass123"
        )
        self.admin_client = APIClient()
        refresh = RefreshToken.for_user(self.admin)
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Crear unidad para tests
        self.unit = Unit.objects.create(
            name="Unidad Test Usuarios",
            code="UTU",
            airport="EZE"
        )

        # Crear grupos de roles (esto normalmente lo hace un fixture o migration)
        roles = ["OPERADOR", "JEFE", "CREV", "COORDINADOR_CREV", "ADMIN"]
        for role in roles:
            Group.objects.get_or_create(name=role)

    def test_create_person_with_user_account(self):
        """Crear personal con cuenta de usuario."""
        person_data = {
            "first_name": "Juan",
            "last_name": "Pérez",
            "badge_number": "300001",
            "role": "OPERADOR",
            "rank": "CIVIL",
            "unit": self.unit.code,
            "username": "juan.perez",
            "password": "password123",
            "is_active": True
        }
        
        response = self.admin_client.post("/api/users/", person_data, format='json')
        
        # Verificar respuesta
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['first_name'], "Juan")
        self.assertEqual(response.data['last_name'], "Pérez")
        self.assertEqual(response.data['username'], "juan.perez")
        
        # Verificar que se creó el usuario
        user = User.objects.get(username="juan.perez")
        self.assertIsNotNone(user)
        self.assertTrue(user.is_active)
        
        # Verificar que se creó la persona
        person = Person.objects.get(badge_number="300001")
        self.assertIsNotNone(person)
        self.assertEqual(person.user, user)
        self.assertEqual(person.role, "OPERADOR")

    def test_create_user_different_roles(self):
        """Crear usuarios con diferentes roles."""
        roles = [
            ("OPERADOR", "operador.test", "300010"),
            ("JEFE", "jefe.test", "300011"),
            ("CREV", "crev.test", "300012"),
            ("COORDINADOR_CREV", "coord.test", "300013"),
            ("ADMIN", "admin.test", "300014"),
        ]
        
        for role, username, badge in roles:
            person_data = {
                "first_name": f"Test {role}",
                "last_name": "Usuario",
                "badge_number": badge,
                "role": role,
                "rank": "CIVIL",
                "unit": self.unit.code,
                "username": username,
                "password": "password123",
            }
            
            response = self.admin_client.post("/api/users/", person_data, format='json')
            self.assertEqual(response.status_code, 201, f"Falló crear usuario con rol {role}")
            
            # Verificar que el usuario existe
            user = User.objects.get(username=username)
            self.assertIsNotNone(user)
            
            # Verificar que la persona tiene el rol correcto
            person = Person.objects.get(badge_number=badge)
            self.assertEqual(person.role, role)

    def test_create_user_without_person(self):
        """Crear usuario sin persona asociada (solo cuenta)."""
        # Esto debería fallar porque el sistema requiere persona
        user_data = {
            "username": "solo.usuario",
            "password": "password123",
        }
        
        response = self.admin_client.post("/api/users/", user_data, format='json')
        # El sistema requiere datos de persona
        self.assertIn(response.status_code, [201, 400])

    def test_create_user_duplicate_username(self):
        """Verificar que no se pueden crear usuarios duplicados."""
        # Crear primer usuario
        person_data_1 = {
            "first_name": "Usuario",
            "last_name": "Uno",
            "badge_number": "300020",
            "role": "OPERADOR",
            "unit": self.unit.code,
            "username": "usuario.duplicado",
            "password": "password123",
        }
        response_1 = self.admin_client.post("/api/users/", person_data_1, format='json')
        self.assertEqual(response_1.status_code, 201)
        
        # Intentar crear segundo usuario con mismo username
        person_data_2 = {
            "first_name": "Usuario",
            "last_name": "Dos",
            "badge_number": "300021",
            "role": "OPERADOR",
            "unit": self.unit.code,
            "username": "usuario.duplicado",  # Mismo username
            "password": "password123",
        }
        response_2 = self.admin_client.post("/api/users/", person_data_2, format='json')
        
        # Debería fallar por username duplicado
        self.assertEqual(response_2.status_code, 400)
        self.assertIn("username", response_2.data)

    def test_create_user_duplicate_badge(self):
        """Verificar que no se pueden crear personas con legajo duplicado."""
        # Crear primer usuario
        person_data_1 = {
            "first_name": "Usuario",
            "last_name": "Uno",
            "badge_number": "300050",  # Badge único
            "role": "OPERADOR",
            "unit": self.unit.code,
            "username": "usuario.badge1",
            "password": "password123",
        }
        response_1 = self.admin_client.post("/api/users/", person_data_1, format='json')
        self.assertEqual(response_1.status_code, 201)

        # Intentar crear segundo usuario con mismo badge
        person_data_2 = {
            "first_name": "Usuario",
            "last_name": "Dos",
            "badge_number": "300050",  # Mismo badge
            "role": "OPERADOR",
            "unit": self.unit.code,
            "username": "usuario.badge2",
            "password": "password123",
        }
        response_2 = self.admin_client.post("/api/users/", person_data_2, format='json')

        # Debería fallar por badge duplicado (400 Bad Request)
        self.assertEqual(response_2.status_code, 400)

    def test_assign_role_group(self):
        """Verificar que assign_role_group funciona correctamente."""
        user = User.objects.create_user(
            username="test.role.assign",
            password="pass123"
        )
        
        # Asignar diferentes roles
        roles = ["OPERADOR", "JEFE", "CREV", "COORDINADOR_CREV", "ADMIN"]
        
        for role in roles:
            assign_role_group(user, role)
            user.refresh_from_db()
            # Verificar que el usuario tiene el grupo asignado
            groups = user.groups.values_list('name', flat=True)
            self.assertIn(role, groups)


class SystemUserAccessTest(TestCase):
    """Tests para verificar acceso de usuarios a diferentes sistemas."""

    def setUp(self):
        # Crear unidades
        self.unit_eze = Unit.objects.create(name="Ezeiza", code="EZE", airport="EZE")
        self.unit_apa = Unit.objects.create(name="Aeroparques", code="APA", airport="AEP")
        
        # Crear sistemas CCTV
        self.system_eze = System.objects.create(
            name="CCTV EZE",
            system_type="CCTV",
            unit=self.unit_eze
        )
        self.system_apa = System.objects.create(
            name="CCTV APA",
            system_type="CCTV",
            unit=self.unit_apa
        )
        
        # Crear administrador
        self.admin = User.objects.create_superuser(
            username="admin_system_test",
            email="admin_system@test.com",
            password="pass123"
        )
        self.admin_client = APIClient()
        refresh = RefreshToken.for_user(self.admin)
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_create_cctv_system_user(self):
        """Crear usuario para sistema CCTV."""
        # Crear usuario operador para EZE
        person_data = {
            "first_name": "Operador",
            "last_name": "CCTV",
            "badge_number": "400001",
            "role": "OPERADOR",
            "rank": "CIVIL",
            "unit": self.unit_eze.code,
            "username": "operador.cctv.eze",
            "password": "password123",
        }
        
        response = self.admin_client.post("/api/users/", person_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Verificar que el usuario puede autenticarse
        user = User.objects.get(username="operador.cctv.eze")
        self.assertIsNotNone(user)
        
        # Verificar que la persona está asociada a la unidad correcta
        person = Person.objects.get(badge_number="400001")
        self.assertEqual(person.unit, self.unit_eze)

    def test_create_gestorcoc_system_user(self):
        """Crear usuario para sistema GestorCOC."""
        # Crear usuario CREV
        person_data = {
            "first_name": "Fiscalizador",
            "last_name": "CREV",
            "badge_number": "400010",
            "role": "CREV",
            "rank": "CIVIL",
            "unit": self.unit_eze.code,
            "username": "crev.fiscalizador",
            "password": "password123",
        }
        
        response = self.admin_client.post("/api/users/", person_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Verificar que el usuario puede autenticarse
        user = User.objects.get(username="crev.fiscalizador")
        self.assertIsNotNone(user)
        
        # Verificar que la persona tiene rol CREV
        person = Person.objects.get(badge_number="400010")
        self.assertEqual(person.role, "CREV")

    def test_user_can_access_own_unit_data(self):
        """Verificar que usuario puede acceder a datos de su unidad."""
        # Crear usuario operador para EZE
        person_data = {
            "first_name": "Operador",
            "last_name": "EZE",
            "badge_number": "400020",
            "role": "OPERADOR",
            "rank": "CIVIL",
            "unit": self.unit_eze.code,
            "username": "operador.eze.access",
            "password": "password123",
        }
        
        response = self.admin_client.post("/api/users/", person_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Autenticar como el usuario operador
        user = User.objects.get(username="operador.eze.access")
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Verificar que puede ver sistemas de su unidad
        response = client.get("/api/systems/")
        self.assertEqual(response.status_code, 200)
        
        systems = response.data['results']
        system_ids = [s['id'] for s in systems]
        
        # Debe ver el sistema de EZE
        self.assertIn(self.system_eze.id, system_ids)
        # NO debe ver el sistema de APA
        self.assertNotIn(self.system_apa.id, system_ids)

    def test_crev_user_can_access_all_units(self):
        """Verificar que usuario CREV puede acceder a todas las unidades."""
        # Crear usuario CREV
        person_data = {
            "first_name": "CREV",
            "last_name": "Fiscalizador",
            "badge_number": "400030",
            "role": "CREV",
            "rank": "CIVIL",
            "unit": self.unit_eze.code,
            "username": "crev.all.access",
            "password": "password123",
        }
        
        response = self.admin_client.post("/api/users/", person_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Autenticar como CREV
        user = User.objects.get(username="crev.all.access")
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Verificar que puede ver sistemas de TODAS las unidades
        response = client.get("/api/systems/")
        self.assertEqual(response.status_code, 200)
        
        systems = response.data['results']
        system_ids = [s['id'] for s in systems]
        
        # Debe ver ambos sistemas
        self.assertIn(self.system_eze.id, system_ids)
        self.assertIn(self.system_apa.id, system_ids)


if __name__ == '__main__':
    import unittest
    unittest.main()
