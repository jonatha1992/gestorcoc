from django.http import FileResponse
from django.core.exceptions import RequestDataTooBig
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
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
        'received_by',
        'verified_by_crev',
        'generator_unit',
    ).prefetch_related('involved_people').all()
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
        'operator': ['exact'],
        'received_by': ['exact'],
        'request_type': ['exact'],
        'request_kind': ['exact'],
        'generator_unit': ['exact'],
    }
    
    # Búsqueda
    search_fields = [
        'judicial_case_number',
        'issue_number',
        'request_number',
        'case_title',
        'requester',
        'judicial_office',
        'judicial_secretary',
        'judicial_holder',
        'incident_place',
        'incident_sector',
        'criminal_problematic',
        'incident_modality',
        'dvd_number',
        'report_number',
        'expediente_number',
        'retrieved_by',
        'involved_people__first_name',
        'involved_people__last_name',
        'involved_people__document_number',
        'operator',
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

        if verified_by.role != 'ADMIN':
            return Response({
                'error': 'Solo un Administrador puede verificar registros.'
            }, status=status.HTTP_400_BAD_REQUEST)

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


class DashboardQueryMixin:
    BA_CODES = {"AEP", "EZE", "FDO", "BHI", "MDQ"}

    def _to_bool(self, raw):
        if raw is None:
            return None
        val = str(raw).strip().lower()
        if val in {"true", "1", "yes", "si", "sí"}:
            return True
        if val in {"false", "0", "no"}:
            return False
        return None

    def _parse_dt(self, raw, end=False):
        if not raw:
            return None
        dt = parse_datetime(raw)
        if dt:
            return dt
        d = parse_date(raw)
        if not d:
            return None
        base = timezone.datetime.combine(d, timezone.datetime.max.time() if end else timezone.datetime.min.time())
        if timezone.is_naive(base):
            base = timezone.make_aware(base, timezone.get_current_timezone())
        return base

    def _trend(self, rows, field_name, days=30):
        cutoff = timezone.now() - timedelta(days=days)
        data = (
            rows.filter(**{f"{field_name}__gte": cutoff})
            .annotate(day=TruncDate(field_name))
            .values("day")
            .annotate(value=Count("id"))
            .order_by("day")
        )
        return [{"label": str(row["day"])[:10], "value": row["value"]} for row in data if row["day"]]

    def _distribution(self, rows, field_name, fallback="SIN_DATO"):
        data = rows.values(field_name).annotate(value=Count("id")).order_by("-value")
        return [{"label": row[field_name] or fallback, "value": row["value"]} for row in data]

    def _apply_novedades_filters(self, request):
        from novedades.models import Novedad

        qs = Novedad.objects.select_related("camera__server__system__unit", "server__system__unit", "system__unit")
        p = request.query_params
        search = (p.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(description__icontains=search)
                | Q(camera__name__icontains=search)
                | Q(server__name__icontains=search)
                | Q(system__name__icontains=search)
                | Q(cameraman_gear__name__icontains=search)
                | Q(reporter_name__icontains=search)
                | Q(reported_by__first_name__icontains=search)
                | Q(reported_by__last_name__icontains=search)
            )
        for field in ["status", "severity", "incident_type", "camera", "server", "system", "cameraman_gear"]:
            value = p.get(field)
            if value not in (None, ""):
                qs = qs.filter(**{field: value})
        asset_type = (p.get("asset_type") or "").strip().upper()
        if asset_type == "CAMERA":
            qs = qs.filter(camera__isnull=False)
        elif asset_type == "SERVER":
            qs = qs.filter(server__isnull=False)
        elif asset_type == "SYSTEM":
            qs = qs.filter(system__isnull=False)
        elif asset_type == "GEAR":
            qs = qs.filter(cameraman_gear__isnull=False)
        gte = self._parse_dt(p.get("created_at__gte"))
        lte = self._parse_dt(p.get("created_at__lte"), end=True)
        if gte:
            qs = qs.filter(created_at__gte=gte)
        if lte:
            qs = qs.filter(created_at__lte=lte)
        return qs

    def _apply_hechos_filters(self, request):
        from hechos.models import Hecho

        qs = Hecho.objects.select_related("camera__server__system__unit")
        p = request.query_params
        search = (p.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(description__icontains=search)
                | Q(sector__icontains=search)
                | Q(external_ref__icontains=search)
                | Q(elements__icontains=search)
            )
        for field in ["category", "camera"]:
            value = p.get(field)
            if value not in (None, ""):
                qs = qs.filter(**{field: value})
        for bool_field in ["is_solved", "coc_intervention", "generated_cause"]:
            parsed = self._to_bool(p.get(bool_field))
            if parsed is not None:
                qs = qs.filter(**{bool_field: parsed})
        gte = self._parse_dt(p.get("timestamp__gte"))
        lte = self._parse_dt(p.get("timestamp__lte"), end=True)
        if gte:
            qs = qs.filter(timestamp__gte=gte)
        if lte:
            qs = qs.filter(timestamp__lte=lte)
        return qs

    def _apply_records_filters(self, request):
        qs = FilmRecord.objects.select_related("received_by", "verified_by_crev")
        p = request.query_params
        search = (p.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(judicial_case_number__icontains=search)
                | Q(issue_number__icontains=search)
                | Q(request_number__icontains=search)
                | Q(case_title__icontains=search)
                | Q(requester__icontains=search)
                | Q(sistema__icontains=search)
                | Q(operator__icontains=search)
            )
        for field in ["delivery_status", "sistema", "operator", "received_by", "verified_by_crev"]:
            value = p.get(field)
            if value not in (None, ""):
                qs = qs.filter(**{field: value})
        for bool_field in ["is_integrity_verified", "has_backup"]:
            parsed = self._to_bool(p.get(bool_field))
            if parsed is not None:
                qs = qs.filter(**{bool_field: parsed})
        date_from = parse_date(p.get("entry_date__gte") or "")
        date_to = parse_date(p.get("entry_date__lte") or "")
        if date_from:
            qs = qs.filter(entry_date__gte=date_from)
        if date_to:
            qs = qs.filter(entry_date__lte=date_to)
        return qs

    def _apply_personnel_filters(self, request):
        from personnel.models import Person

        qs = Person.objects.select_related("unit")
        p = request.query_params
        search = (p.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(badge_number__icontains=search)
                | Q(rank__icontains=search)
                | Q(guard_group__icontains=search)
                | Q(unit__name__icontains=search)
                | Q(unit__code__icontains=search)
            )
        for field in ["role", "guard_group"]:
            value = p.get(field)
            if value not in (None, ""):
                qs = qs.filter(**{field: value})
        unit_code = p.get("unit__code") or p.get("unit")
        if unit_code not in (None, ""):
            qs = qs.filter(unit__code=unit_code)
        active = self._to_bool(p.get("is_active"))
        if active is not None:
            qs = qs.filter(is_active=active)
        return qs


class DashboardNovedadesView(DashboardQueryMixin, views.APIView):
    def get(self, request):
        rows = self._apply_novedades_filters(request)
        total = rows.count()
        cards = [
            {"id": "total", "label": "Total Novedades", "value": total},
            {"id": "open", "label": "Abiertas", "value": rows.filter(status="OPEN").count()},
            {"id": "critical_high", "label": "Críticas/Altas", "value": rows.filter(severity__in=["CRITICAL", "HIGH"]).count()},
            {"id": "closed", "label": "Cerradas", "value": rows.filter(status="CLOSED").count()},
        ]
        return Response({
            "module": "novedades",
            "cards": cards,
            "series": {
                "trend": self._trend(rows, "created_at"),
                "distribution_primary": self._distribution(rows, "status"),
                "distribution_secondary": self._distribution(rows, "severity"),
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay novedades para los filtros seleccionados."},
        })


class DashboardHechosView(DashboardQueryMixin, views.APIView):
    def get(self, request):
        rows = self._apply_hechos_filters(request)
        total = rows.count()
        cards = [
            {"id": "total", "label": "Total Hechos", "value": total},
            {"id": "today", "label": "Hoy", "value": rows.filter(timestamp__date=timezone.now().date()).count()},
            {"id": "unsolved", "label": "Sin Resolver", "value": rows.filter(is_solved=False).count()},
            {"id": "solved", "label": "Resueltos", "value": rows.filter(is_solved=True).count()},
        ]
        return Response({
            "module": "hechos",
            "cards": cards,
            "series": {
                "trend": self._trend(rows, "timestamp"),
                "distribution_primary": self._distribution(rows, "category"),
                "distribution_secondary": [
                    {"label": "Resueltos", "value": rows.filter(is_solved=True).count()},
                    {"label": "Pendientes", "value": rows.filter(is_solved=False).count()},
                ],
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay hechos registrados. Cargá hechos para habilitar analítica."},
        })


class DashboardRecordsView(DashboardQueryMixin, views.APIView):
    def get(self, request):
        rows = self._apply_records_filters(request)
        total = rows.count()
        cards = [
            {"id": "total", "label": "Total Registros", "value": total},
            {"id": "verified", "label": "Verificados", "value": rows.filter(is_integrity_verified=True).count()},
            {"id": "pending", "label": "Pendientes", "value": rows.filter(is_integrity_verified=False).count()},
            {"id": "month", "label": "Mes Actual", "value": rows.filter(created_at__month=timezone.now().month, created_at__year=timezone.now().year).count()},
        ]
        return Response({
            "module": "records",
            "cards": cards,
            "series": {
                "trend": self._trend(rows, "created_at"),
                "distribution_primary": self._distribution(rows, "delivery_status"),
                "distribution_secondary": [
                    {"label": "Verificados", "value": rows.filter(is_integrity_verified=True).count()},
                    {"label": "No verificados", "value": rows.filter(is_integrity_verified=False).count()},
                ],
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay registros fílmicos para los filtros seleccionados."},
        })


class DashboardPersonnelView(DashboardQueryMixin, views.APIView):
    def get(self, request):
        rows = self._apply_personnel_filters(request)
        total = rows.count()
        cards = [
            {"id": "total", "label": "Total Personal", "value": total},
            {"id": "active", "label": "Activos", "value": rows.filter(is_active=True).count()},
            {"id": "inactive", "label": "Inactivos", "value": rows.filter(is_active=False).count()},

        ]
        return Response({
            "module": "personnel",
            "cards": cards,
            "series": {
                "trend": self._trend(rows, "created_at"),
                "distribution_primary": self._distribution(rows, "role"),
                "distribution_secondary": [
                    {"label": "Activos", "value": rows.filter(is_active=True).count()},
                    {"label": "Inactivos", "value": rows.filter(is_active=False).count()},
                ],
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay personal para los filtros seleccionados."},
        })


class DashboardMapView(DashboardQueryMixin, views.APIView):
    def get(self, request):
        from assets.models import Unit, Camera

        scope = (request.query_params.get("scope") or "").strip().lower()
        units = Unit.objects.filter(map_enabled=True)
        if scope == "ba":
            units = units.filter(code__in=self.BA_CODES)
        novedades_base = self._apply_novedades_filters(request)
        hechos_base = self._apply_hechos_filters(request)
        records_base = self._apply_records_filters(request)
        points = []
        for unit in units:
            if unit.latitude is None or unit.longitude is None:
                continue
            novedades = novedades_base.filter(
                Q(camera__server__system__unit=unit) | Q(server__system__unit=unit) | Q(system__unit=unit)
            )
            hechos = hechos_base.filter(camera__server__system__unit=unit)
            records = records_base.filter(generator_unit=unit)
            cameras = Camera.objects.filter(server__system__unit=unit)
            last_event = max(
                [val for val in [novedades.aggregate(v=Max("created_at"))["v"], hechos.aggregate(v=Max("timestamp"))["v"], records.aggregate(v=Max("created_at"))["v"]] if val is not None],
                default=None,
            )
            points.append({
                "unit_code": unit.code,
                "unit_name": unit.name,
                "airport": unit.airport,
                "lat": float(unit.latitude),
                "lon": float(unit.longitude),
                "novedades_count": novedades.count(),
                "hechos_count": hechos.count(),
                "records_count": records.count(),
                "cameras_online": cameras.filter(status="ONLINE").count(),
                "cameras_offline": cameras.exclude(status="ONLINE").count(),
                "last_event_at": last_event.isoformat() if last_event else None,
            })
        return Response({"scope": scope or "all", "points": points})

