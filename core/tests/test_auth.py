from datetime import date

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from core.models import Catalog, CatalogItem
from documents.models import Document
from inventory.models import Camera
from operations.models import Detector, Hecho


class AuthAndHomeTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(username="user", password="pass1234")

        # Base data for stats
        catalog = Catalog.objects.create(name="Ubicaciones", code="UBICACIONES")
        location = CatalogItem.objects.create(catalog=catalog, name="Sala", order=1)

        Hecho.objects.create(
            nro_orden=1,
            fecha_intervencion=timezone.now(),
            quien_detecta=Detector.MONITOREO,
        )
        Document.objects.create(
            doc_type="ENTRADA",
            date=date.today(),
            reference_number="EXP-TEST",
            sender="CREV",
            recipient="COC",
            subject="Test",
            status="PENDIENTE",
            priority="MEDIA",
        )
        Camera.objects.create(name="Cam 1", location=location, status="Operativa")

    def test_home_requires_login(self):
        resp = self.client.get(reverse("core:home"))
        self.assertEqual(resp.status_code, 302)
        self.assertIn(reverse("core:login"), resp.url)

    def test_login_and_stats(self):
        resp = self.client.post(reverse("core:login"), {"username": "user", "password": "pass1234"})
        self.assertEqual(resp.status_code, 302)

        resp = self.client.get(reverse("core:home"))
        self.assertEqual(resp.status_code, 200)
        stats = resp.context["stats"]
        self.assertEqual(stats["hechos"], 1)
        self.assertEqual(stats["documents"], 1)
        self.assertEqual(stats["camaras"], 1)
