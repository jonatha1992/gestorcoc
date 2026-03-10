from django.test import TestCase

from assets.models import Unit
from assets.serializers import SystemSerializer


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
