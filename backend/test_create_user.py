import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CreateUserTest(TestCase):
    """Test case for user creation via API."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin_test",
            email="admin@test.com",
            password="pass123"
        )
        # Generate JWT token for authentication
        refresh = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_create_user(self):
        """Test creating a new user via the API."""
        response = self.client.post("/api/users/", {
            "username": "testuser77",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User",
            "badge_number": "123",
            "role": "OPERADOR"
        }, format='json')

        print(f"\nStatus Code: {response.status_code}")
        if response.status_code == 500:
            print(response.content.decode("utf-8"))
        else:
            print(f"Success: {response.json()}")

        self.assertEqual(response.status_code, 201)
