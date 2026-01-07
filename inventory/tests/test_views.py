from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from core.models import Catalog, CatalogItem
from inventory.models import Camera, Equipment, EquipmentStatus


class InventoryViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_superuser(
            username="admin", password="admin123", email="admin@example.com"
        )
        self.client.force_login(self.user)

        self.catalog_cat = Catalog.objects.create(name="Categorias", code="CATEGORIAS")
        self.catalog_loc = Catalog.objects.create(name="Ubicaciones", code="UBICACIONES")
        self.category_item = CatalogItem.objects.create(catalog=self.catalog_cat, name="Camara", order=1)
        self.location_item = CatalogItem.objects.create(catalog=self.catalog_loc, name="Sala", order=1)

    def test_equipment_create_and_list(self):
        resp = self.client.post(
            reverse("inventory:equipment_create"),
            {
                "name": "Servidor 1",
                "category": self.category_item.id,
                "location": self.location_item.id,
                "status": EquipmentStatus.AVAILABLE,
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Equipment.objects.count(), 1)

        resp = self.client.get(reverse("inventory:equipment_list"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Servidor 1")

    def test_camera_create_and_list(self):
        resp = self.client.post(
            reverse("inventory:camera_create"),
            {
                "name": "Cam Test",
                "location": self.location_item.id,
                "status": "Operativa",
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Camera.objects.count(), 1)

        resp = self.client.get(reverse("inventory:camera_list"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Cam Test")
