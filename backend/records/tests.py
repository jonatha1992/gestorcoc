import json
from io import BytesIO
from unittest.mock import Mock, patch
from django.conf import settings
from django.core.exceptions import RequestDataTooBig
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from .services import IntegrityService


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
            "cantidad_observada": "2 personas",
            "sectores_analizados": "Hall de arribos, cinta 3",
            "franja_horaria_analizada": "14:05 a 15:42",
            "tiempo_total_analisis": "1 hora 37 minutos",
            "sintesis_conclusion": "No se observa manipulación posterior del bulto",
            "hash_algorithms": ["sha256", "sha512"],
            "hash_program": "HASH MY FILE",
            "medida_seguridad_interna": "Auditoria interna del COC",
            "vms_authenticity_mode": "vms_propio",
            "vms_authenticity_detail": "",
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

    @patch('records.views.IntegrityService.generate_video_analysis_docx')
    def test_accepts_integrity_and_authenticity_fields(self, service_mock):
        service_mock.return_value = (BytesIO(b'docx-data'), 'informe.docx')
        report_data = {
            **self.valid_report_data,
            "hash_algorithms": ["sha3", "sha256", "sha512"],
            "hash_program": "HASH MY FILE",
            "medida_seguridad_interna": "Control de auditoria del COC",
            "vms_authenticity_mode": "hash_preventivo",
        }
        payload = {"report_data": report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 200)
        service_mock.assert_called_once()

    def test_rejects_invalid_hash_algorithm_in_report_data(self):
        report_data = {**self.valid_report_data, "hash_algorithms": ["sha256", "md5"]}
        payload = {"report_data": report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
        self.assertIn('hash_algorithms', str(response.data))

    def test_requires_vms_authenticity_detail_when_mode_is_otro(self):
        report_data = {
            **self.valid_report_data,
            "vms_authenticity_mode": "otro",
            "vms_authenticity_detail": "",
        }
        payload = {"report_data": report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
        self.assertIn('vms_authenticity_detail', str(response.data))

    @patch('records.views.IntegrityService.generate_video_analysis_docx')
    def test_allows_empty_fiscalia_and_fiscal(self, service_mock):
        service_mock.return_value = (BytesIO(b'docx-data'), 'informe.docx')
        report_data = {**self.valid_report_data, "fiscalia": "", "fiscal": ""}
        payload = {"report_data": report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 200)
        service_mock.assert_called_once()

    @patch('records.views.IntegrityService.generate_video_analysis_docx')
    def test_accepts_legacy_location_fields_without_error(self, service_mock):
        service_mock.return_value = (BytesIO(b'docx-data'), 'informe.docx')
        report_data = {
            **self.valid_report_data,
            "unidad_aeroportuaria": "Unidad Legacy",
            "asiento": "Asiento Legacy",
        }
        payload = {"report_data": report_data, "frames": []}

        response = self.client.post(self.url, payload, format='json')

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


class SerializerLimitConsistencyTests(TestCase):
    """Verify that serializer fallback defaults match settings.py values."""

    def test_max_frames_default_matches_settings(self):
        from .serializers import _video_report_max_frames
        expected = int(getattr(settings, 'VIDEO_REPORT_MAX_FRAMES', 30))
        self.assertEqual(_video_report_max_frames(), expected)

    def test_max_frame_size_default_matches_settings(self):
        from .serializers import _video_report_max_frame_size_bytes
        expected = int(getattr(settings, 'VIDEO_REPORT_MAX_FRAME_SIZE_BYTES', 8 * 1024 * 1024))
        self.assertEqual(_video_report_max_frame_size_bytes(), expected)

    def test_max_total_bytes_default_matches_settings(self):
        from .serializers import _video_report_max_total_bytes
        expected = int(getattr(settings, 'VIDEO_REPORT_MAX_TOTAL_BYTES', 80 * 1024 * 1024))
        self.assertEqual(_video_report_max_total_bytes(), expected)


class VideoAnalysisImproveTextApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/video-analysis-improve-text/'

    @patch('records.views.IntegrityService.improve_report_text_with_ai')
    def test_improves_text_fields(self, improve_mock):
        improve_mock.return_value = {
            "material_filmico": "Material filmico mejorado",
            "desarrollo": "Desarrollo mejorado",
            "conclusion": "Conclusion mejorada",
        }
        payload = {
            "material_filmico": "Texto original de material filmico",
            "desarrollo": "Texto original de desarrollo",
            "conclusion": "Texto original de conclusion",
            "material_context": {
                "sistema": "MILESTONE",
                "aeropuerto": "Aeropuerto Internacional Mtro. Pistarini",
                "cantidad_observada": "2 personas",
                "sectores_analizados": "Hall de arribos, cinta 3",
                "franja_horaria_analizada": "14:05 a 15:42",
                "tiempo_total_analisis": "1 hora 37 minutos",
                "sintesis_conclusion": "No se observa manipulación posterior del bulto",
                "hash_algorithms": ["sha256", "sha512"],
                "vms_authenticity_mode": "vms_propio",
            },
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('material_filmico'), "Material filmico mejorado")
        self.assertEqual(response.data.get('desarrollo'), "Desarrollo mejorado")
        self.assertEqual(response.data.get('conclusion'), "Conclusion mejorada")
        improve_mock.assert_called_once_with(
            "Texto original de material filmico",
            "Texto original de desarrollo",
            "Texto original de conclusion",
            custom_api_key="",
            material_context={
                "sistema": "MILESTONE",
                "aeropuerto": "Aeropuerto Internacional Mtro. Pistarini",
                "cantidad_observada": "2 personas",
                "sectores_analizados": "Hall de arribos, cinta 3",
                "franja_horaria_analizada": "14:05 a 15:42",
                "tiempo_total_analisis": "1 hora 37 minutos",
                "sintesis_conclusion": "No se observa manipulación posterior del bulto",
                "hash_algorithms": ["sha256", "sha512"],
                "vms_authenticity_mode": "vms_propio",
            },
            mode="full",
        )

    @patch('records.views.IntegrityService.improve_report_text_with_ai')
    def test_accepts_context_only_payload(self, improve_mock):
        improve_mock.return_value = {
            "material_filmico": "Material filmico mejorado",
            "desarrollo": "Desarrollo mejorado",
            "conclusion": "Conclusion mejorada",
        }

        response = self.client.post(
            self.url,
            {
                "material_filmico": "",
                "desarrollo": "",
                "conclusion": "",
                "material_context": {
                    "sectores_analizados": "Hall de arribos, cinta 3",
                    "franja_horaria_analizada": "14:05 a 15:42",
                    "tiempo_total_analisis": "1 hora 37 minutos",
                    "sintesis_conclusion": "No se observa manipulación posterior del bulto",
                }
            },
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        improve_mock.assert_called_once()

    def test_rejects_empty_payload(self):
        response = self.client.post(
            self.url,
            {"material_filmico": "", "desarrollo": "", "conclusion": ""},
            format='json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)

    def test_rejects_context_when_vms_mode_otro_without_detail(self):
        response = self.client.post(
            self.url,
            {
                "material_filmico": "texto",
                "material_context": {
                    "vms_authenticity_mode": "otro",
                    "vms_authenticity_detail": "",
                },
            },
            format='json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
        self.assertIn('vms_authenticity_detail', str(response.data))

    @patch('records.views.IntegrityService.improve_report_text_with_ai', side_effect=RuntimeError('No se configuro AI_TEXT_API_KEY.'))
    def test_returns_503_when_ai_is_not_configured(self, _improve_mock):
        payload = {"desarrollo": "algo", "conclusion": ""}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data.get('error'), 'No se configuro AI_TEXT_API_KEY.')


class IntegrityServiceAiRequestTests(TestCase):
    @staticmethod
    def _mock_ai_success_response():
        response_mock = Mock()
        response_mock.status_code = 200
        response_mock.json.return_value = {
            "choices": [
                {"message": {"content": '{"material_filmico":"Material filmico mejorado","desarrollo":"Desarrollo mejorado","conclusion":"Conclusion mejorada"}'}}
            ]
        }
        return response_mock

    @staticmethod
    def _mock_ai_error_response(status_code, message):
        response_mock = Mock()
        response_mock.status_code = status_code
        response_mock.json.return_value = {"error": {"message": message}}
        response_mock.text = message
        return response_mock

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='gemini,openrouter,groq',
        AI_TEXT_PROVIDER_SELECTION='round_robin',
        GEMINI_API_KEY='gemini-key',
        AI_TEXT_GEMINI_API_URL='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        AI_TEXT_GEMINI_MODEL='gemini-2.5-flash',
        OPEN_ROUTER_API_KEY='openrouter-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
        GROQ_API_KEY='groq-key',
        AI_TEXT_GROQ_API_URL='https://api.groq.com/openai/v1/chat/completions',
        AI_TEXT_GROQ_MODEL='llama-3.3-70b-versatile',
    )
    def test_round_robin_rotates_start_provider(self):
        IntegrityService._provider_rotation_index = 0

        first = IntegrityService._get_ai_provider_chain()
        second = IntegrityService._get_ai_provider_chain()
        third = IntegrityService._get_ai_provider_chain()

        self.assertEqual([item['name'] for item in first], ['gemini', 'openrouter', 'groq'])
        self.assertEqual([item['name'] for item in second], ['openrouter', 'groq', 'gemini'])
        self.assertEqual([item['name'] for item in third], ['groq', 'gemini', 'openrouter'])

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='openrouter',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        OPEN_ROUTER_API_KEY='test-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
        AI_TEXT_TIMEOUT_SECONDS=33,
    )
    @patch('records.services.requests.post')
    def test_sends_only_narrative_fields_to_ai(self, post_mock):
        post_mock.return_value = self._mock_ai_success_response()

        result = IntegrityService.improve_report_text_with_ai(
            "Texto original de material filmico",
            "Texto original de desarrollo",
            "Texto original de conclusion",
        )

        self.assertEqual(result.get('material_filmico'), 'Material filmico mejorado')
        self.assertEqual(result.get('desarrollo'), 'Desarrollo mejorado')
        self.assertEqual(result.get('conclusion'), 'Conclusion mejorada')
        post_mock.assert_called_once()

        _, kwargs = post_mock.call_args
        self.assertEqual(kwargs.get('timeout'), 33)
        self.assertEqual(kwargs.get('headers', {}).get('Authorization'), 'Bearer test-key')

        request_payload = kwargs.get('json') or {}
        self.assertEqual(
            set(request_payload.keys()),
            {'model', 'temperature', 'messages', 'response_format'}
        )
        self.assertEqual(request_payload.get('model'), 'gpt-4o-mini')
        self.assertEqual(request_payload.get('response_format'), {'type': 'json_object'})

        messages = request_payload.get('messages') or []
        self.assertEqual(len(messages), 2)
        user_content = json.loads(messages[1].get('content') or '{}')
        self.assertEqual(
            set(user_content.keys()),
            {
                'instrucciones',
                'formato_estricto',
                'material_filmico_original',
                'desarrollo_original',
                'conclusion_original',
                'material_context',
            }
        )
        self.assertEqual(user_content.get('material_filmico_original'), 'Texto original de material filmico')
        self.assertEqual(user_content.get('desarrollo_original'), 'Texto original de desarrollo')
        self.assertEqual(user_content.get('conclusion_original'), 'Texto original de conclusion')
        self.assertEqual(user_content.get('material_context'), {})

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='openrouter',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        OPEN_ROUTER_API_KEY='test-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
        AI_TEXT_TIMEOUT_SECONDS=33,
    )
    @patch('records.services.requests.post')
    def test_includes_material_context_in_ai_prompt_when_provided(self, post_mock):
        post_mock.return_value = self._mock_ai_success_response()

        context = {
            "sistema": "MILESTONE",
            "aeropuerto": "Aeropuerto Internacional Mtro. Pistarini",
            "cantidad_observada": "2 personas",
            "sectores_analizados": "Hall de arribos, cinta 3",
            "franja_horaria_analizada": "14:05 a 15:42",
            "tiempo_total_analisis": "1 hora 37 minutos",
            "sintesis_conclusion": "No se observa manipulación posterior del bulto",
            "hash_algorithms": ["sha256", "sha512"],
            "hash_program": "HASH MY FILE",
            "medida_seguridad_interna": "Auditoria interna",
            "vms_authenticity_mode": "vms_propio",
        }
        IntegrityService.improve_report_text_with_ai(
            "Texto material",
            "Texto desarrollo",
            "Texto conclusion",
            material_context=context,
        )

        _, kwargs = post_mock.call_args
        request_payload = kwargs.get('json') or {}
        messages = request_payload.get('messages') or []
        user_content = json.loads(messages[1].get('content') or '{}')
        self.assertEqual(user_content.get('material_context'), context)

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='gemini,openrouter,groq',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        GEMINI_API_KEY='gemini-key',
        AI_TEXT_GEMINI_API_URL='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        AI_TEXT_GEMINI_MODEL='gemini-2.5-flash',
        OPEN_ROUTER_API_KEY='openrouter-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
        GROQ_API_KEY='groq-key',
        AI_TEXT_GROQ_API_URL='https://api.groq.com/openai/v1/chat/completions',
        AI_TEXT_GROQ_MODEL='llama-3.3-70b-versatile',
        AI_TEXT_TIMEOUT_SECONDS=20,
    )
    @patch('records.services.requests.post')
    def test_fallbacks_from_gemini_to_openrouter_on_quota(self, post_mock):
        post_mock.side_effect = [
            self._mock_ai_error_response(429, 'RESOURCE_EXHAUSTED: resource has been exhausted'),
            self._mock_ai_success_response(),
        ]

        result = IntegrityService.improve_report_text_with_ai(
            "texto material",
            "texto desarrollo",
            "texto conclusion"
        )

        self.assertEqual(result.get('material_filmico'), 'Material filmico mejorado')
        self.assertEqual(result.get('desarrollo'), 'Desarrollo mejorado')
        self.assertEqual(result.get('conclusion'), 'Conclusion mejorada')
        self.assertEqual(post_mock.call_count, 2)
        self.assertIn('generativelanguage.googleapis.com', post_mock.call_args_list[0].kwargs.get('url', ''))
        self.assertIn('openrouter.ai', post_mock.call_args_list[1].kwargs.get('url', ''))

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='gemini,openrouter,groq',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        GEMINI_API_KEY='gemini-key',
        AI_TEXT_GEMINI_API_URL='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        AI_TEXT_GEMINI_MODEL='gemini-2.5-flash',
        OPEN_ROUTER_API_KEY='openrouter-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
        AI_TEXT_TIMEOUT_SECONDS=20,
    )
    @patch('records.services.requests.post')
    def test_does_not_fallback_on_non_quota_error(self, post_mock):
        post_mock.return_value = self._mock_ai_error_response(400, 'Bad request: invalid response_format')

        with self.assertRaises(RuntimeError) as exc:
            IntegrityService.improve_report_text_with_ai(
                "texto material",
                "texto desarrollo",
                "texto conclusion"
            )

        self.assertIn('La API de IA devolvio un error (400).', str(exc.exception))
        self.assertEqual(post_mock.call_count, 1)

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='gemini,openrouter,groq',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        GEMINI_API_KEY='gemini-key',
        AI_TEXT_GEMINI_API_URL='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        AI_TEXT_GEMINI_MODEL='gemini-2.5-flash',
        OPEN_ROUTER_API_KEY='openrouter-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
        GROQ_API_KEY='groq-key',
        AI_TEXT_GROQ_API_URL='https://api.groq.com/openai/v1/chat/completions',
        AI_TEXT_GROQ_MODEL='llama-3.3-70b-versatile',
        AI_TEXT_TIMEOUT_SECONDS=20,
    )
    @patch('records.services.requests.post')
    def test_returns_controlled_error_when_all_providers_hit_quota(self, post_mock):
        post_mock.side_effect = [
            self._mock_ai_error_response(429, 'RESOURCE_EXHAUSTED'),
            self._mock_ai_error_response(402, 'insufficient credits'),
            self._mock_ai_error_response(429, 'rate limit exceeded'),
        ]

        with self.assertRaises(RuntimeError) as exc:
            IntegrityService.improve_report_text_with_ai(
                "texto material",
                "texto desarrollo",
                "texto conclusion"
            )

        self.assertEqual(
            str(exc.exception),
            'Todos los proveedores de IA alcanzaron su limite de cuota/tokens.'
        )
        self.assertEqual(post_mock.call_count, 3)

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='openrouter',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        OPEN_ROUTER_API_KEY='test-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
    )
    @patch('records.services.requests.post')
    def test_mode_material_filmico_sends_system_data_context(self, post_mock):
        """mode='material_filmico' debe enviar datos técnicos (sistema, hash, VMS)."""
        response_mock = Mock()
        response_mock.status_code = 200
        response_mock.json.return_value = {
            "choices": [{"message": {"content": '{"material_filmico":"Material generado"}'}}]
        }
        post_mock.return_value = response_mock

        context = {
            "sistema": "MILESTONE",
            "aeropuerto": "Aeroparque",
            "hash_algorithms": ["sha256"],
            "hash_program": "HashMyFiles",
            "vms_authenticity_mode": "vms_propio",
        }
        result = IntegrityService.improve_report_text_with_ai(
            "texto original", "", "", material_context=context, mode='material_filmico'
        )

        self.assertEqual(result.get('material_filmico'), 'Material generado')
        # modo específico: desarrollo y conclusion no cambian
        self.assertEqual(result.get('desarrollo'), '')
        self.assertEqual(result.get('conclusion'), '')

        _, kwargs = post_mock.call_args
        messages = kwargs.get('json', {}).get('messages', [])
        user_content = json.loads(messages[1].get('content') or '{}')
        self.assertIn('datos_del_sistema', user_content)
        self.assertEqual(user_content['datos_del_sistema']['sistema_cctv'], 'MILESTONE')
        self.assertEqual(user_content['datos_del_sistema']['algoritmos_hash'], 'SHA256')
        self.assertEqual(user_content['datos_del_sistema']['medida_autenticidad'], 'VMS propio del sistema de grabacion')
        # Solo debe pedir material_filmico en el formato
        self.assertEqual(set(user_content['formato_estricto'].keys()), {'material_filmico'})

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='openrouter',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        OPEN_ROUTER_API_KEY='test-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
    )
    @patch('records.services.requests.post')
    def test_mode_desarrollo_sends_analysis_context(self, post_mock):
        """mode='desarrollo' debe enviar datos analíticos (sectores, franja, tiempo, cantidad)."""
        response_mock = Mock()
        response_mock.status_code = 200
        response_mock.json.return_value = {
            "choices": [{"message": {"content": '{"desarrollo":"Desarrollo generado"}'}}]
        }
        post_mock.return_value = response_mock

        context = {
            "sectores_analizados": "Hall de arribos",
            "franja_horaria_analizada": "14:00 a 15:30",
            "tiempo_total_analisis": "1 hora 30 minutos",
            "cantidad_observada": "3 pasajeros",
        }
        result = IntegrityService.improve_report_text_with_ai(
            "", "texto desarrollo", "", material_context=context, mode='desarrollo'
        )

        self.assertEqual(result.get('desarrollo'), 'Desarrollo generado')
        self.assertEqual(result.get('material_filmico'), '')
        self.assertEqual(result.get('conclusion'), '')

        _, kwargs = post_mock.call_args
        messages = kwargs.get('json', {}).get('messages', [])
        user_content = json.loads(messages[1].get('content') or '{}')
        self.assertIn('datos_del_analisis', user_content)
        self.assertEqual(user_content['datos_del_analisis']['sectores_analizados'], 'Hall de arribos')
        self.assertEqual(set(user_content['formato_estricto'].keys()), {'desarrollo'})

    @override_settings(
        AI_TEXT_PROVIDER_ORDER='openrouter',
        AI_TEXT_PROVIDER_SELECTION='ordered',
        AI_TEXT_FALLBACK_MODE='quota_only',
        OPEN_ROUTER_API_KEY='test-key',
        AI_TEXT_OPENROUTER_API_URL='https://openrouter.ai/api/v1/chat/completions',
        AI_TEXT_OPENROUTER_MODEL='gpt-4o-mini',
    )
    @patch('records.services.requests.post')
    def test_mode_conclusion_sends_synthesis_context(self, post_mock):
        """mode='conclusion' debe enviar datos de síntesis."""
        response_mock = Mock()
        response_mock.status_code = 200
        response_mock.json.return_value = {
            "choices": [{"message": {"content": '{"conclusion":"Conclusion generada"}'}}]
        }
        post_mock.return_value = response_mock

        context = {
            "sintesis_conclusion": "No se observa manipulación",
            "cantidad_observada": "2 personas",
        }
        result = IntegrityService.improve_report_text_with_ai(
            "", "", "texto conclusion", material_context=context, mode='conclusion'
        )

        self.assertEqual(result.get('conclusion'), 'Conclusion generada')
        self.assertEqual(result.get('material_filmico'), '')
        self.assertEqual(result.get('desarrollo'), '')

        _, kwargs = post_mock.call_args
        messages = kwargs.get('json', {}).get('messages', [])
        user_content = json.loads(messages[1].get('content') or '{}')
        self.assertIn('datos_para_conclusion', user_content)
        self.assertEqual(
            user_content['datos_para_conclusion']['sintesis_del_analisis'],
            'No se observa manipulación'
        )
        self.assertEqual(set(user_content['formato_estricto'].keys()), {'conclusion'})

    def test_mode_rejects_invalid_value(self):
        """El serializer debe rechazar un mode inválido."""
        from .serializers import VideoReportImproveTextSerializer
        serializer = VideoReportImproveTextSerializer(data={
            "material_filmico": "texto",
            "mode": "inventado",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('mode', serializer.errors)
