from django.http import FileResponse
from django.core.exceptions import RequestDataTooBig
from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from .models import FilmRecord, Catalog
from .serializers import (
    FilmRecordSerializer,
    CatalogSerializer,
    VideoReportPayloadSerializer,
    VideoReportImproveTextSerializer,
)
from .services import IntegrityService

class FilmRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de Registros Fílmicos.
    Incluye búsqueda, filtrado y acción de verificación CREV.
    """
    queryset = FilmRecord.objects.select_related(
        'camera', 
        'operator', 
        'received_by', 
        'verified_by_crev'
    ).all()
    serializer_class = FilmRecordSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtros
    filterset_fields = {
        'delivery_status': ['exact'],
        'has_backup': ['exact'],
        'is_editable': ['exact'],
        'entry_date': ['gte', 'lte', 'exact'],
        'verified_by_crev': ['isnull'],
    }
    
    # Búsqueda
    search_fields = [
        'judicial_case_number',
        'issue_number',
        'request_number',
        'case_title',
        'requester',
        'camera__name',
    ]
    
    # Ordenamiento
    ordering_fields = ['entry_date', 'created_at', 'delivery_status', 'id']
    ordering = ['-entry_date', '-created_at']
    
    @action(detail=True, methods=['post'])
    def verify_by_crev(self, request, pk=None):
        """
        Acción personalizada para que un fiscalizador CREV verifique un registro.
        Solo usuarios con permisos CREV pueden ejecutar esta acción.
        
        POST /api/film-records/{id}/verify_by_crev/
        Body: {
            "verified_by": <person_id>,
            "observations": "Observaciones opcionales"
        }
        """
        film_record = self.get_object()
        
        # Validar que el registro no esté ya verificado
        if film_record.verified_by_crev:
            return Response({
                'error': 'Este registro ya fue verificado por CREV',
                'verified_by': f"{film_record.verified_by_crev.last_name}, {film_record.verified_by_crev.first_name}",
                'verification_date': film_record.verification_date
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que tenga backup y hash
        if not film_record.has_backup or not film_record.file_hash:
            return Response({
                'error': 'El registro debe tener backup y hash calculado antes de ser verificado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el verificador del request
        verified_by_id = request.data.get('verified_by')
        observations = request.data.get('observations', '')
        
        if not verified_by_id:
            return Response({
                'error': 'Debe especificar el ID del verificador CREV (verified_by)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from personnel.models import Person
            verified_by = Person.objects.get(id=verified_by_id)
        except Person.DoesNotExist:
            return Response({
                'error': f'No se encontró una persona con ID {verified_by_id}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Marcar como verificado
        film_record.verified_by_crev = verified_by
        film_record.verification_date = timezone.now()
        film_record.is_editable = False  # Se bloquea automáticamente
        if observations:
            film_record.observations = film_record.observations + f"\n[CREV {timezone.now().strftime('%d/%m/%Y')}] {observations}" if film_record.observations else observations
        film_record.save()
        
        serializer = self.get_serializer(film_record)
        return Response({
            'message': 'Registro verificado exitosamente por CREV',
            'record': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def verification_certificate(self, request, pk=None):
        """
        Genera y descarga el certificado PDF de verificación CREV.
        
        GET /api/film-records/{id}/verification_certificate/
        """
        film_record = self.get_object()
        
        # Generar el PDF
        pdf_buffer = IntegrityService.generate_verification_report(film_record)
        
        filename = f"certificado_integridad_registro_{film_record.id}.pdf"
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=filename,
            content_type='application/pdf'
        )

class CatalogViewSet(viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer

class IntegrityReportView(views.APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        algorithm = request.data.get('algorithm', 'sha256').lower()
        allowed_algorithms = {'sha256', 'sha512', 'sha3', 'all'}

        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        if algorithm not in allowed_algorithms:
            return Response(
                {"error": "Algoritmo no soportado. Use: sha256, sha512 o sha3."},
                status=status.HTTP_400_BAD_REQUEST
            )

        hashes = {}
        try:
            if algorithm in ['sha256', 'all']:
                hashes['SHA256'] = IntegrityService.calculate_file_hash(file_obj, 'sha256')
                file_obj.seek(0)

            if algorithm in ['sha512', 'all']:
                hashes['SHA512'] = IntegrityService.calculate_file_hash(file_obj, 'sha512')
                file_obj.seek(0)

            if algorithm in ['sha3', 'all']:
                hashes['SHA-3'] = IntegrityService.calculate_file_hash(file_obj, 'sha3')
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        pdf_buffer = IntegrityService.generate_integrity_pdf(file_obj.name, file_obj.size, hashes)
        
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"integrity_report_{file_obj.name}.pdf",
            content_type='application/pdf'
        )


class IntegritySummaryReportView(views.APIView):
    """
    Genera un PDF resumen con todos los hashes calculados en la UI.

    POST /api/integrity-summary-report/
    Body:
    {
      "entries": [
        {"name":"file1.mp4","size":1234,"algorithm":"SHA-256","hash":"...","time_ms":12}
      ]
    }
    """

    def post(self, request, *args, **kwargs):
        payload = request.data if isinstance(request.data, dict) else {}
        entries = payload.get("entries", [])

        if not isinstance(entries, list) or len(entries) == 0:
            return Response(
                {"error": "Debe enviar una lista no vacia en 'entries'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        pdf_buffer = IntegrityService.generate_integrity_summary_pdf(entries)
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename="integrity_report_resumen.pdf",
            content_type='application/pdf'
        )


class VideoAnalysisReportView(views.APIView):
    """
    Genera informe DOCX de analisis de video a partir de un formulario.

    POST /api/video-analysis-report/
    Body: JSON con campos del formulario.
    """

    def post(self, request, *args, **kwargs):
        try:
            payload = request.data if isinstance(request.data, dict) else {}

            # Backward compatibility: payload plano anterior.
            if payload and 'report_data' not in payload:
                payload = {'report_data': payload, 'frames': []}

            serializer = VideoReportPayloadSerializer(data=payload)
            serializer.is_valid(raise_exception=True)

            buffer, filename = IntegrityService.generate_video_analysis_docx(serializer.validated_data)
            return FileResponse(
                buffer,
                as_attachment=True,
                filename=filename,
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        except Exception as exc:
            if isinstance(exc, RequestDataTooBig):
                return Response(
                    {"error": "El tamaño total del informe excede el máximo permitido."},
                    status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                )
            if isinstance(exc, ValidationError):
                return Response({"errors": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
            if isinstance(exc, FileNotFoundError):
                return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(exc, RuntimeError):
                return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"error": f"Error al generar informe: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VideoAnalysisImproveTextView(views.APIView):
    """
    Mejora con IA los campos narrativos del informe (material fílmico, desarrollo y conclusion).

    POST /api/video-analysis-improve-text/
    Body: {"material_filmico": "...", "desarrollo": "...", "conclusion": "..."}
    """

    def post(self, request, *args, **kwargs):
        try:
            payload = request.data if isinstance(request.data, dict) else {}
            serializer = VideoReportImproveTextSerializer(data=payload)
            serializer.is_valid(raise_exception=True)

            improved_text = IntegrityService.improve_report_text_with_ai(
                serializer.validated_data.get('material_filmico', ''),
                serializer.validated_data.get('desarrollo', ''),
                serializer.validated_data.get('conclusion', ''),
                custom_api_key=serializer.validated_data.get('api_key', ''),
                material_context=serializer.validated_data.get('material_context', {}),
                mode=serializer.validated_data.get('mode', 'full'),
            )
            return Response(improved_text, status=status.HTTP_200_OK)
        except Exception as exc:
            if isinstance(exc, ValidationError):
                return Response({"errors": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
            if isinstance(exc, RuntimeError):
                message = str(exc)
                if message.startswith("No se configuro AI_TEXT_"):
                    return Response({"error": message}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                return Response({"error": message}, status=status.HTTP_502_BAD_GATEWAY)
            return Response({"error": f"Error al mejorar texto con IA: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

