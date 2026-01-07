from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from core.models import Catalog, CatalogItem
from documents.models import Document, DocumentAttachment, FilmRecord


@override_settings(MEDIA_ROOT="/tmp/django_test_media")
class DocumentViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_superuser(
            username="admin", password="admin123", email="admin@example.com"
        )
        self.client.force_login(self.user)

        self.catalog_solicitud = Catalog.objects.create(name="Tipos Solicitud", code="TIPOS_SOLICITUD")
        self.catalog_delito = Catalog.objects.create(name="Tipos Delito", code="TIPOS_DELITO")
        self.item_solicitud = CatalogItem.objects.create(catalog=self.catalog_solicitud, name="Judicial", order=1)
        self.item_delito = CatalogItem.objects.create(catalog=self.catalog_delito, name="Robo", order=1)

    def test_document_create_with_attachment(self):
        file = SimpleUploadedFile("test.txt", b"hello", content_type="text/plain")
        resp = self.client.post(
            reverse("documents:document_create"),
            {
                "doc_type": "ENTRADA",
                "date": date.today().strftime("%Y-%m-%d"),
                "reference_number": "EXP-100",
                "sender": "CREV",
                "recipient": "COC",
                "subject": "Test",
                "description": "Documento de prueba",
                "status": "PENDIENTE",
                "priority": "MEDIA",
                "attachments": [file],
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(DocumentAttachment.objects.count(), 1)

    def test_film_record_create(self):
        resp = self.client.post(
            reverse("documents:film_record_create"),
            {
                "nro_asunto": "REG-1",
                "estado": "Pendiente",
                "tipo_solicitud": self.item_solicitud.id,
                "tipo_delito": self.item_delito.id,
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(FilmRecord.objects.count(), 1)
