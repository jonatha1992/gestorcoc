import os
import django
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()

try:
    admin = User.objects.get(username="SeisanCoc")
except User.DoesNotExist:
    # Si no existe creamos uno dummy que sea superuser
    admin = User.objects.create_superuser("admin_test_1", "admin@aa.com", "pass123")

client = Client()
client.force_login(admin)

response = client.post("/api/users/", {
    "username": "testuser77",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "badge_number": "123",
    "role": "OPERADOR"
}, content_type="application/json")

print("Status Code:", response.status_code)
if response.status_code == 500:
    print(response.content.decode("utf-8"))
else:
    print("Success:", response.json())
