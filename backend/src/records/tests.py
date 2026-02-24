from io import BytesIO
from unittest.mock import patch
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
            "frames": [{
                "id_temp": "f1",
                "file_name": "frame1.jpg",
                "mime_type": "image/jpeg",
                "content_base64": "%%%invalid%%%",
                "description": "Frame 1",
                "order": 0
            }]
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
