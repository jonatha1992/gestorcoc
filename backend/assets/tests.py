import base64

from django.test import TestCase, override_settings

from assets.models import Unit
from assets.serializers import CameraSerializer, SystemSerializer


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
        payload = base64.b64encode(b'a' * size_bytes).decode('ascii')
        return f'data:{mime_type};base64,{payload}'

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
