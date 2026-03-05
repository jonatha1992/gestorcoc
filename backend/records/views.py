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
from .models import FilmRecord, Catalog, VideoAnalysisReport
from .serializers import (
    FilmRecordSerializer,
    CatalogSerializer,
    VideoReportPayloadSerializer,
    VideoReportImproveTextSerializer,
    VideoAnalysisReportSerializer,
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
        'is_integrity_verified': ['exact'],
        'is_editable': ['exact'],
        'entry_date': ['gte', 'lte', 'exact'],
        'verified_by_crev': ['exact', 'isnull'],
        'camera': ['exact'],
        'operator': ['exact'],
        'received_by': ['exact'],
    }
    
    # Búsqueda
    search_fields = [
        'judicial_case_number',
        'issue_number',
        'request_number',
        'case_title',
        'requester',
        'camera__name',
        'operator__first_name',
        'operator__last_name',
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

    @action(detail=True, methods=['post', 'put', 'patch'])
    def save_report_draft(self, request, pk=None):
        """
        Guarda el estado actual del informe (borrador) asociado a este registro.
        
        POST/PUT/PATCH /api/film-records/{id}/save_report_draft/
        Body: JSON con los campos del informe.
        """
        film_record = self.get_object()
        report, created = VideoAnalysisReport.objects.get_or_create(
            film_record=film_record,
            defaults={'form_data': request.data}
        )
        if not created:
            # Update existing form data
            report.form_data = request.data
            report.save()
            
        return Response({
            'message': 'Borrador guardado exitosamente',
            'report_id': report.id
        }, status=status.HTTP_200_OK)

class CatalogViewSet(viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer


class VideoAnalysisReportViewSet(viewsets.ModelViewSet):
    queryset = VideoAnalysisReport.objects.select_related('film_record').all()
    serializer_class = VideoAnalysisReportSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'film_record': ['exact']}

    def update(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Un informe ya generado no puede ser modificado.'},
            status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Un informe ya generado no puede ser modificado.'},
            status=status.HTTP_403_FORBIDDEN
        )

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
                preferred_provider=serializer.validated_data.get('preferred_provider', ''),
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


class AIUsageSummaryView(views.APIView):
    def get(self, request):
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncDate
        from records.models import AIUsageLog
        rows = (
            AIUsageLog.objects
            .annotate(day=TruncDate('created_at'))
            .values('day', 'provider')
            .annotate(calls=Count('id'), total_tokens=Sum('tokens_total'))
            .order_by('-day')[:60]
        )
        return Response(list(rows))


class DashboardStatsView(views.APIView):
    def get(self, request):
        from django.db.models import Count
        from django.db.models.functions import TruncMonth, TruncDate
        from datetime import timedelta
        from records.models import FilmRecord
        from hechos.models import Hecho
        from novedades.models import Novedad

        # Últimos 12 meses (mensuales)
        monthly_records = (
            FilmRecord.objects
            .annotate(month=TruncMonth('entry_date'))
            .values('month').annotate(count=Count('id')).order_by('month')[:12]
        )
        monthly_hechos = (
            Hecho.objects
            .annotate(month=TruncMonth('timestamp'))
            .values('month').annotate(count=Count('id')).order_by('month')[:12]
        )
        monthly_novedades = (
            Novedad.objects
            .annotate(month=TruncMonth('created_at'))
            .values('month').annotate(count=Count('id')).order_by('month')[:12]
        )

        # Últimos 30 días (diarios)
        cutoff = timezone.now() - timedelta(days=30)

        daily_records = (
            FilmRecord.objects.filter(entry_date__gte=cutoff.date())
            .annotate(day=TruncDate('entry_date'))
            .values('day').annotate(count=Count('id')).order_by('day')
        )
        daily_hechos = (
            Hecho.objects.filter(timestamp__gte=cutoff)
            .annotate(day=TruncDate('timestamp'))
            .values('day').annotate(count=Count('id')).order_by('day')
        )
        daily_novedades = (
            Novedad.objects.filter(created_at__gte=cutoff)
            .annotate(day=TruncDate('created_at'))
            .values('day').annotate(count=Count('id')).order_by('day')
        )

        # Se convierten month/day a ISO string para garantizar que el frontend
        # recibe siempre un string (evita TypeError al llamar .startsWith sobre null)
        return Response({
            'monthly': {
                'records': [{'month': str(r['month'])[:10], 'count': r['count']} for r in monthly_records if r['month']],
                'hechos': [{'month': str(r['month'])[:10], 'count': r['count']} for r in monthly_hechos if r['month']],
                'novedades': [{'month': str(r['month'])[:10], 'count': r['count']} for r in monthly_novedades if r['month']],
            },
            'daily': {
                'records': [{'day': str(r['day'])[:10], 'count': r['count']} for r in daily_records if r['day']],
                'hechos': [{'day': str(r['day'])[:10], 'count': r['count']} for r in daily_hechos if r['day']],
                'novedades': [{'day': str(r['day'])[:10], 'count': r['count']} for r in daily_novedades if r['day']],
            }
        })

