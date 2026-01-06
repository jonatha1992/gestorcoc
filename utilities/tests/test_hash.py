from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse


class HashToolTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_superuser(
            username="admin", password="admin123", email="admin@example.com"
        )
        self.client.force_login(self.user)

    def test_hash_generation(self):
        file = SimpleUploadedFile("hash.txt", b"hash-test", content_type="text/plain")
        resp = self.client.post(reverse("utilities:hash_tool"), {"file": file})
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "MD5")
