from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from operations.models import Hecho


class OperationsViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_superuser(
            username="admin", password="admin123", email="admin@example.com"
        )
        self.client.force_login(self.user)

    def test_hecho_create_and_list(self):
        resp = self.client.post(
            reverse("operations:hecho_create"),
            {
                "nro_orden": 10,
                "fecha_intervencion": timezone.now().strftime("%Y-%m-%d %H:%M:%S"),
                "quien_detecta": "Centro Monitoreo",
                "novedad": "Prueba",
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Hecho.objects.count(), 1)

        resp = self.client.get(reverse("operations:hecho_list"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Prueba")
