import base64

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from assets.models import Camera, Server, System, Unit
from assets.serializers import CameraSerializer, SystemSerializer


User = get_user_model()


def _build_photo_data(size_bytes=32, mime_type='image/webp'):
    payload = base64.b64encode(b'a' * size_bytes).decode('ascii')
    return f'data:{mime_type};base64,{payload}'


class SystemSerializerReportDefaultsTests(TestCase):
    def setUp(self):
        self.unit = Unit.objects.create(name='Unidad Test', code='UTT')

    def test_accepts_report_defaults_metadata(self):
        serializer = SystemSerializer(data={
            'name': 'Milestone UTT',
            'unit_id': self.unit.id,
            'system_type': 'CCTV',
            'is_active': True,
            'report_authenticity_mode_default': 'vms_propio',
            'report_native_hash_algorithms_default': ['sha256', 'otro'],
            'report_native_hash_algorithm_other_default': 'Watermark propietaria',
            'report_hash_program_default': 'HashMyFiles',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.report_authenticity_mode_default, 'vms_propio')
        self.assertEqual(instance.report_native_hash_algorithms_default, ['sha256', 'otro'])
        self.assertEqual(instance.report_native_hash_algorithm_other_default, 'Watermark propietaria')
        self.assertEqual(instance.report_hash_program_default, 'HashMyFiles')

    def test_requires_authenticity_detail_when_mode_is_otro(self):
        serializer = SystemSerializer(data={
            'name': 'Sistema Alternativo',
            'unit_id': self.unit.id,
            'system_type': 'CCTV',
            'is_active': True,
            'report_authenticity_mode_default': 'otro',
            'report_authenticity_detail_default': '',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('report_authenticity_detail_default', serializer.errors)

    def test_clears_other_native_hash_when_otro_is_not_selected(self):
        serializer = SystemSerializer(data={
            'name': 'Sistema Sin Otro Hash',
            'unit_id': self.unit.id,
            'system_type': 'CCTV',
            'is_active': True,
            'report_authenticity_mode_default': 'hash_preventivo',
            'report_native_hash_algorithms_default': ['sha256'],
            'report_native_hash_algorithm_other_default': 'No deberia persistir',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.report_native_hash_algorithm_other_default, '')


class CameraSerializerPhotoDataTests(TestCase):
    def _build_photo_data(self, size_bytes=32, mime_type='image/webp'):
        return _build_photo_data(size_bytes=size_bytes, mime_type=mime_type)

    def test_accepts_small_photo_data(self):
        serializer = CameraSerializer(data={
            'name': 'CAM-TEST-01',
            'status': 'ONLINE',
            'resolution': '1080p',
            'photo_data': self._build_photo_data(),
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertTrue(instance.photo_data.startswith('data:image/webp;base64,'))

    def test_rejects_unsupported_photo_type(self):
        serializer = CameraSerializer(data={
            'name': 'CAM-TEST-02',
            'status': 'ONLINE',
            'resolution': '1080p',
            'photo_data': self._build_photo_data(mime_type='image/gif'),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('photo_data', serializer.errors)

    @override_settings(CAMERA_PHOTO_MAX_SIZE_BYTES=8)
    def test_rejects_photo_over_size_limit(self):
        serializer = CameraSerializer(data={
            'name': 'CAM-TEST-03',
            'status': 'ONLINE',
            'resolution': '1080p',
            'photo_data': self._build_photo_data(size_bytes=16),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('photo_data', serializer.errors)


class SystemViewSetCameraPhotoContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username='assets_admin',
            email='assets_admin@example.com',
            password='Temp123456!',
        )
        self.client.force_authenticate(self.user)
        self.unit = Unit.objects.create(name='Unidad AEP', code='AEP')
        self.system = System.objects.create(name='Milestone AEP QA', unit=self.unit, system_type='CCTV')
        self.server = Server.objects.create(
            system=self.system,
            name='SRV-AEP-QA',
            ip_address='10.10.10.10',
        )
        self.camera = Camera.objects.create(
            server=self.server,
            name='CAM-AEP-QA',
            status='ONLINE',
            resolution='1080p',
            photo_data=_build_photo_data(),
        )

    def test_list_systems_includes_nested_camera_photo_data(self):
        response = self.client.get('/api/systems/')

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

        system_payload = next(item for item in response.data['results'] if item['id'] == self.system.id)
        self.assertEqual(len(system_payload['servers']), 1)

        camera_payload = system_payload['servers'][0]['cameras'][0]
        self.assertEqual(camera_payload['id'], self.camera.id)
        self.assertTrue(camera_payload['photo_data'].startswith('data:image/webp;base64,'))

    def test_get_camera_detail_includes_photo_data(self):
        response = self.client.get(f'/api/cameras/{self.camera.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['photo_data'].startswith('data:image/webp;base64,'))

    def test_create_camera_with_photo_data(self):
        payload = {
            'name': 'CAM-NEW-01',
            'status': 'ONLINE',
            'resolution': '720p',
            'ip_address': '10.10.10.11',
            'server': self.server.id,
            'photo_data': _build_photo_data(size_bytes=64, mime_type='image/png'),
        }
        response = self.client.post('/api/cameras/', payload)

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['photo_data'].startswith('data:image/png;base64,'))

    def test_update_camera_replace_photo_data(self):
        new_photo = _build_photo_data(size_bytes=128, mime_type='image/jpeg')
        response = self.client.patch(f'/api/cameras/{self.camera.id}/', {
            'photo_data': new_photo,
        })

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['photo_data'].startswith('data:image/jpeg;base64,'))

    def test_update_camera_clear_photo_data(self):
        response = self.client.patch(f'/api/cameras/{self.camera.id}/', {
            'photo_data': '',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['photo_data'], '')

        # Verify it persisted in DB
        self.camera.refresh_from_db()
        self.assertEqual(self.camera.photo_data, '')
