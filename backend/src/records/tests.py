from io import BytesIO
from unittest.mock import patch
from django.conf import settings
from django.core.exceptions import RequestDataTooBig
from django.test import TestCase
from rest_framework.test import APIClient


class VideoAnalysisReportApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/video-analysis-report/'
        self.valid_report_data = {
            "report_date": "2026-02-23",
            "destinatarios": "URSA I - Jefe",
            "tipo_informe": "IAV - Informe Analisis de Video",
            "numero_informe": "2026/001",
            "grado": "Oficial Mayor",
            "operador": "Operador Test",
            "lup": "1234",
            "sistema": "MILESTONE",
            "prevencion_sumaria": "003BAR/2026",
            "caratula": "DENUNCIA S/ PRESUNTO HURTO",
            "fiscalia": "Fiscalia Nro. 02",
            "fiscal": "Fiscal Test",
            "denunciante": "Denunciante Test",
            "vuelo": "WJ 3045",
            "objeto_denunciado": "RIVER PLATE",
            "desarrollo": "Texto de desarrollo",
            "conclusion": "Texto de conclusion",
            "firma": "Coordinador CReV I DEL ESTE",
        }

    def _build_frame(self, index=0, content_base64="aGVsbG8="):
        return {
            "id_temp": f"f{index}",
            "file_name": f"frame{index}.jpg",
            "mime_type": "image/jpeg",
            "content_base64": content_base64,
            "description": f"Frame {index}",
            "order": index
        }

    @patch('records.views.IntegrityService.generate_video_analysis_docx')
    def test_generates_docx_with_new_payload(self, service_mock):
        service_mock.return_value = (BytesIO(b'docx-data'), 'informe.docx')
        payload = {"report_data": self.valid_report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        service_mock.assert_called_once()

    @patch('records.views.IntegrityService.generate_video_analysis_docx')
    def test_supports_legacy_flat_payload(self, service_mock):
        service_mock.return_value = (BytesIO(b'docx-data'), 'informe.docx')

        response = self.client.post(self.url, self.valid_report_data, format='json')

        self.assertEqual(response.status_code, 200)
        service_mock.assert_called_once()

    def test_rejects_invalid_frame_base64(self):
        payload = {
            "report_data": self.valid_report_data,
            "frames": [self._build_frame(index=0, content_base64="%%%invalid%%%")]
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)

    def test_generates_docx_without_mock(self):
        payload = {"report_data": self.valid_report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        content_head = b''.join(response.streaming_content)[:2]
        self.assertEqual(content_head, b'PK')

    def test_rejects_more_than_max_frames(self):
        max_frames = int(getattr(settings, 'VIDEO_REPORT_MAX_FRAMES', 30))
        payload = {
            "report_data": self.valid_report_data,
            "frames": [self._build_frame(index=i) for i in range(max_frames + 1)]
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
        self.assertIn(str(max_frames), str(response.data))

    @patch('records.serializers.base64.b64decode')
    def test_rejects_frame_larger_than_max_frame_size(self, decode_mock):
        max_frame_size = int(getattr(settings, 'VIDEO_REPORT_MAX_FRAME_SIZE_BYTES', 8 * 1024 * 1024))
        decode_mock.return_value = b'a' * (max_frame_size + 1)

        payload = {
            "report_data": self.valid_report_data,
            "frames": [self._build_frame(index=0)]
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
        self.assertIn(f"{max_frame_size // (1024 * 1024)} MB", str(response.data))

    @patch('records.serializers.base64.b64decode')
    def test_rejects_total_frames_size_over_max_total(self, decode_mock):
        max_frames = int(getattr(settings, 'VIDEO_REPORT_MAX_FRAMES', 30))
        max_frame_size = int(getattr(settings, 'VIDEO_REPORT_MAX_FRAME_SIZE_BYTES', 8 * 1024 * 1024))
        max_total = int(getattr(settings, 'VIDEO_REPORT_MAX_TOTAL_BYTES', 80 * 1024 * 1024))

        chunk_size = min(max_frame_size, (max_total // max_frames) + 1)
        decode_mock.return_value = b'b' * chunk_size
        frame_count = (max_total // chunk_size) + 1

        payload = {
            "report_data": self.valid_report_data,
            "frames": [self._build_frame(index=i) for i in range(frame_count)]
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
        self.assertIn(f"{max_total // (1024 * 1024)} MB", str(response.data))

    @patch('records.views.VideoReportPayloadSerializer.is_valid', side_effect=RequestDataTooBig('too large'))
    def test_returns_413_when_request_data_is_too_large(self, _is_valid_mock):
        payload = {"report_data": self.valid_report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 413)
        self.assertEqual(
            response.data.get('error'),
            "El tamaño total del informe excede el máximo permitido."
        )


class VideoAnalysisImproveTextApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/video-analysis-improve-text/'

    @patch('records.views.IntegrityService.improve_report_text_with_ai')
    def test_improves_text_fields(self, improve_mock):
        improve_mock.return_value = {
            "desarrollo": "Desarrollo mejorado",
            "conclusion": "Conclusion mejorada",
        }
        payload = {
            "desarrollo": "Texto original de desarrollo",
            "conclusion": "Texto original de conclusion",
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('desarrollo'), "Desarrollo mejorado")
        self.assertEqual(response.data.get('conclusion'), "Conclusion mejorada")
        improve_mock.assert_called_once()

    def test_rejects_empty_payload(self):
        response = self.client.post(self.url, {"desarrollo": "", "conclusion": ""}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)

    @patch('records.views.IntegrityService.improve_report_text_with_ai', side_effect=RuntimeError('No se configuro AI_TEXT_API_KEY.'))
    def test_returns_503_when_ai_is_not_configured(self, _improve_mock):
        payload = {"desarrollo": "algo", "conclusion": ""}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data.get('error'), 'No se configuro AI_TEXT_API_KEY.')
