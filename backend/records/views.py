from django.http import FileResponse
from django.core.exceptions import RequestDataTooBig
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.db.models import Count, F, Max, Q, OuterRef, Subquery, IntegerField, Sum, Value
from django.db.models.functions import TruncDate, TruncMonth, Coalesce
from datetime import timedelta
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from core.audit import set_audit_context
from core.mixins import UnitFilterMixin
from personnel.access import PermissionCode
from personnel.permissions import ActionPermissionMixin, HasNamedPermission
from .models import FilmRecord, Catalog, VideoAnalysisReport
from .serializers import (
    FilmRecordSerializer,
    CatalogSerializer,
    VideoReportPayloadSerializer,
    VideoReportImproveTextSerializer,
    VideoAnalysisReportSerializer,
)
from .services import IntegrityService

class FilmRecordViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
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
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        'list': [PermissionCode.VIEW_RECORDS],
        'retrieve': [PermissionCode.VIEW_RECORDS],
        'create': [PermissionCode.MANAGE_RECORDS],
        'update': [PermissionCode.MANAGE_RECORDS],
        'partial_update': [PermissionCode.MANAGE_RECORDS],
        'destroy': [PermissionCode.MANAGE_RECORDS],
        'verify_by_crev': [PermissionCode.VERIFY_CREV],
        'verification_certificate': [PermissionCode.VIEW_RECORDS],
        'save_report_draft': [PermissionCode.USE_REPORTS],
    }
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

    def get_queryset(self):
        queryset = super().get_queryset()
        return self.filter_by_unit(queryset, 'generator_unit')

    @action(detail=True, methods=['post'])
    def verify_by_crev(self, request, pk=None):
        """
        Acción personalizada para que un fiscalizador CREV verifique un registro.
        """
        film_record = self.get_object()
        set_audit_context(
            request,
            action='verify_by_crev',
            target={
                'app': film_record._meta.app_label,
                'model': film_record._meta.model_name,
                'id': film_record.pk,
                'repr': str(film_record),
            },
        )
        
        if film_record.verified_by_crev:
            return Response({
                'error': 'Este registro ya fue verificado por CREV',
                'verified_by': f"{film_record.verified_by_crev.last_name}, {film_record.verified_by_crev.first_name}",
                'verification_date': film_record.verification_date
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not film_record.has_backup or not film_record.file_hash:
            return Response({
                'error': 'El registro debe tener backup y hash calculado antes de ser verificado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        observations = request.data.get('observations', '')
        verified_by = getattr(request.user, 'person', None)
        if verified_by is None:
            return Response({
                'error': 'El usuario autenticado debe estar vinculado a una persona para verificar registros.'
            }, status=status.HTTP_400_BAD_REQUEST)

        film_record.verified_by_crev = verified_by
        film_record.verification_date = timezone.now()
        film_record.is_editable = False
        if observations:
            film_record.observations = film_record.observations + f"\n[CREV {timezone.now().strftime('%d/%m/%Y')}] {observations}" if film_record.observations else observations
        film_record.save()
        set_audit_context(
            request,
            actor=request.user,
            username=request.user.username,
            message='Registro verificado por CREV',
            changes={
                'verified_by_crev_id': film_record.verified_by_crev_id,
                'is_editable': film_record.is_editable,
            },
        )
        
        serializer = self.get_serializer(film_record)
        return Response({
            'message': 'Registro verificado exitosamente por CREV',
            'record': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def verification_certificate(self, request, pk=None):
        film_record = self.get_object()
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
        film_record = self.get_object()
        payload = request.data if isinstance(request.data, dict) else {}
        form_data = payload.get('form_data', payload)
        status_value = payload.get('status') or 'BORRADOR'
        numero_informe = payload.get('numero_informe') or form_data.get('numero_informe', '')
        report_date = payload.get('report_date') or form_data.get('report_date')

        if status_value == 'FINALIZADO' and not (
            request.user.is_superuser or request.user.has_perm(f'personnel.{PermissionCode.MANAGE_CREV_FLOW}')
        ):
            return Response(
                {'detail': 'Solo Coordinacion CREV o Admin puede finalizar informes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        report = VideoAnalysisReport.objects.filter(film_record=film_record).first()
        if report and report.status == 'FINALIZADO':
            return Response(
                {'detail': 'Un informe finalizado no puede ser modificado.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = VideoAnalysisReportSerializer(
            instance=report,
            data={
                'film_record': film_record.id,
                'numero_informe': numero_informe or '',
                'report_date': report_date or None,
                'status': status_value,
                'form_data': form_data,
            },
            partial=report is not None,
        )
        serializer.is_valid(raise_exception=True)
        saved_report = serializer.save(film_record=film_record)
        set_audit_context(
            request,
            action='finalize_report' if status_value == 'FINALIZADO' else 'save_report_draft',
            actor=request.user,
            username=request.user.username,
            target={
                'app': saved_report._meta.app_label,
                'model': saved_report._meta.model_name,
                'id': saved_report.pk,
                'repr': str(saved_report),
            },
            message='Informe finalizado' if status_value == 'FINALIZADO' else 'Borrador de informe guardado',
            changes={'status': saved_report.status, 'film_record_id': film_record.pk},
        )
        return Response(VideoAnalysisReportSerializer(saved_report).data, status=status.HTTP_200_OK)

class CatalogViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        'list': [PermissionCode.VIEW_RECORDS],
        'retrieve': [PermissionCode.VIEW_RECORDS],
        'create': [PermissionCode.MANAGE_CREV_FLOW],
        'update': [PermissionCode.MANAGE_CREV_FLOW],
        'partial_update': [PermissionCode.MANAGE_CREV_FLOW],
        'destroy': [PermissionCode.MANAGE_CREV_FLOW],
    }

class VideoAnalysisReportViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = VideoAnalysisReport.objects.select_related('film_record').all()
    serializer_class = VideoAnalysisReportSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        'list': [PermissionCode.USE_REPORTS],
        'retrieve': [PermissionCode.USE_REPORTS],
        'create': [PermissionCode.USE_REPORTS],
        'update': [PermissionCode.USE_REPORTS],
        'partial_update': [PermissionCode.USE_REPORTS],
        'destroy': [PermissionCode.MANAGE_CREV_FLOW],
    }
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {'film_record': ['exact']}

    def create(self, request, *args, **kwargs):
        if (request.data or {}).get('status') == 'FINALIZADO' and not self._can_manage_crev_flow(request):
            return Response(
                {'detail': 'Solo Coordinacion CREV o Admin puede finalizar informes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if (request.data or {}).get('status') == 'FINALIZADO' and not self._can_manage_crev_flow(request):
            return Response(
                {'detail': 'Solo Coordinacion CREV o Admin puede finalizar informes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if instance.status == 'FINALIZADO':
            return Response(
                {'detail': 'Un informe finalizado no puede ser modificado.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if (request.data or {}).get('status') == 'FINALIZADO' and not self._can_manage_crev_flow(request):
            return Response(
                {'detail': 'Solo Coordinacion CREV o Admin puede finalizar informes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if instance.status == 'FINALIZADO':
            return Response(
                {'detail': 'Un informe finalizado no puede ser modificado.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def _can_manage_crev_flow(self, request):
        return request.user.is_superuser or request.user.has_perm(f'personnel.{PermissionCode.MANAGE_CREV_FLOW}')

class IntegrityReportView(views.APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.USE_INTEGRITY]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        algorithm = request.data.get('algorithm', 'sha256').lower()
        allowed_algorithms = {'sha256', 'sha512', 'sha3', 'all'}

        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        if algorithm not in allowed_algorithms:
            return Response(
                {"error": "Algoritmo no soportado."},
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
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.USE_INTEGRITY]

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
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.USE_REPORTS]

    def post(self, request, *args, **kwargs):
        try:
            payload = request.data if isinstance(request.data, dict) else {}
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
        except RequestDataTooBig:
            return Response(
                {"error": "El informe excede el tamano maximo permitido para la solicitud."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )
        except ValidationError as exc:
            return Response({"errors": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VideoAnalysisImproveTextView(views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.USE_REPORTS]

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
        except ValidationError as exc:
            return Response({"errors": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AIUsageSummaryView(views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.MANAGE_CREV_FLOW]

    def get(self, request):
        from records.models import AIUsageLog
        rows = (
            AIUsageLog.objects
            .annotate(day=TruncDate('created_at'))
            .values('day', 'provider')
            .annotate(calls=Count('id'), total_tokens=Sum('tokens_total'))
            .order_by('-day')[:60]
        )
        return Response(list(rows))

class DashboardStatsView(UnitFilterMixin, views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.VIEW_DASHBOARD]

    def get(self, request):
        from records.models import FilmRecord
        from hechos.models import Hecho
        from novedades.models import Novedad

        cutoff = timezone.now() - timedelta(days=30)

        rec_qs = self.filter_by_unit(FilmRecord.objects.all(), 'generator_unit')
        hec_qs = self.filter_by_unit(Hecho.objects.all(), 'camera__server__system__unit')
        
        nov_qs = Novedad.objects.all()
        if not self.is_global_viewer():
            person = getattr(request.user, "person", None)
            if person and person.unit:
                nov_qs = nov_qs.filter(
                    Q(camera__server__system__unit=person.unit) |
                    Q(server__system__unit=person.unit) |
                    Q(system__unit=person.unit) |
                    Q(cameraman_gear__assigned_to__unit=person.unit)
                ).distinct()
            else:
                nov_qs = nov_qs.none()

        data = {
            'monthly': {
                'records': list(rec_qs.annotate(month=TruncMonth('entry_date')).values('month').annotate(count=Count('id')).order_by('month')[:12]),
                'hechos': list(hec_qs.annotate(month=TruncMonth('timestamp')).values('month').annotate(count=Count('id')).order_by('month')[:12]),
                'novedades': list(nov_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month')[:12]),
            },
            'daily': {
                'records': list(rec_qs.filter(entry_date__gte=cutoff.date()).annotate(day=TruncDate('entry_date')).values('day').annotate(count=Count('id')).order_by('day')),
                'hechos': list(hec_qs.filter(timestamp__gte=cutoff).annotate(day=TruncDate('timestamp')).values('day').annotate(count=Count('id')).order_by('day')),
                'novedades': list(nov_qs.filter(created_at__gte=cutoff).annotate(day=TruncDate('created_at')).values('day').annotate(count=Count('id')).order_by('day')),
            }
        }
        return Response(data)

class DashboardQueryMixin(UnitFilterMixin):
    BA_CODES = {"AEP", "EZE", "FDO", "BHI", "MDQ"}

    def _to_bool(self, raw):
        if raw is None: return None
        val = str(raw).strip().lower()
        if val in {"true", "1", "yes", "si", "sí"}: return True
        if val in {"false", "0", "no"}: return False
        return None

    def _parse_dt(self, raw, end=False):
        if not raw: return None
        d = parse_date(raw)
        if d:
            base = timezone.datetime.combine(d, timezone.datetime.max.time() if end else timezone.datetime.min.time())
            if timezone.is_naive(base):
                base = timezone.make_aware(base, timezone.get_current_timezone())
            return base
        dt = parse_datetime(raw)
        if not dt: return None
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.get_current_timezone())
        return dt

    def _trend(self, rows, field_name, days=30):
        scoped_rows = rows
        model_field = rows.model._meta.get_field(field_name)
        is_date_only = model_field.get_internal_type() == "DateField"

        if days is not None:
            cutoff = timezone.localdate() - timedelta(days=days) if is_date_only else timezone.now() - timedelta(days=days)
            scoped_rows = scoped_rows.filter(**{f"{field_name}__gte": cutoff})

        if is_date_only:
            data = (
                scoped_rows.order_by()
                .annotate(day=F(field_name))
                .values("day")
                .annotate(value=Count("id"))
                .order_by("day")
            )
        else:
            data = (
                scoped_rows.order_by().annotate(day=TruncDate(field_name))
                .values("day")
                .annotate(value=Count("id"))
                .order_by("day")
            )
        return [{"label": row["day"].strftime('%Y-%m-%d') if row["day"] else "SIN_FECHA", "value": row["value"]} for row in data]

    def _distribution(self, rows, field_name, fallback="SIN_DATO"):
        data = rows.order_by().values(field_name).annotate(value=Count("id")).order_by("-value")
        return [{"label": row[field_name] or fallback, "value": row["value"]} for row in data]

    def _apply_novedades_filters(self, request):
        from novedades.models import Novedad
        qs = Novedad.objects.all()
        p = request.query_params

        if hasattr(self, 'is_global_viewer') and not self.is_global_viewer():
            person = getattr(request.user, "person", None)
            if person and person.unit:
                qs = qs.filter(
                    Q(camera__server__system__unit=person.unit) |
                    Q(server__system__unit=person.unit) |
                    Q(system__unit=person.unit) |
                    Q(cameraman_gear__assigned_to__unit=person.unit)
                ).distinct()
            else:
                qs = qs.none()
        else:
            unit = p.get("unit_code")
            if unit: qs = qs.filter(Q(camera__server__system__unit__code=unit) | Q(server__system__unit__code=unit) | Q(system__unit__code=unit))

        search = (p.get("search") or "").strip()
        if search:
            qs = qs.filter(Q(description__icontains=search) | Q(camera__name__icontains=search))
        for field in ["status", "severity", "incident_type"]:
            val = p.get(field)
            if val: qs = qs.filter(**{field: val})
        gte, lte = self._parse_dt(p.get("created_at__gte")), self._parse_dt(p.get("created_at__lte"), True)
        if gte: qs = qs.filter(created_at__gte=gte)
        if lte: qs = qs.filter(created_at__lte=lte)
        return qs

    def _apply_hechos_filters(self, request):
        from hechos.models import Hecho
        qs = Hecho.objects.all()
        p = request.query_params

        if hasattr(self, 'is_global_viewer') and not self.is_global_viewer():
            qs = self.filter_by_unit(qs, 'camera__server__system__unit')
        else:
            unit = p.get("unit_code")
            if unit: qs = qs.filter(camera__server__system__unit__code=unit)

        search = (p.get("search") or "").strip()
        if search: qs = qs.filter(Q(description__icontains=search) | Q(sector__icontains=search))
        for field in ["category"]:
            val = p.get(field)
            if val: qs = qs.filter(**{field: val})
        gte, lte = self._parse_dt(p.get("timestamp__gte")), self._parse_dt(p.get("timestamp__lte"), True)
        if gte: qs = qs.filter(timestamp__gte=gte)
        if lte: qs = qs.filter(timestamp__lte=lte)
        return qs

    def _apply_records_filters(self, request):
        from records.models import FilmRecord
        qs = FilmRecord.objects.all()
        p = request.query_params

        if hasattr(self, 'is_global_viewer') and not self.is_global_viewer():
            qs = self.filter_by_unit(qs, 'generator_unit')
        else:
            unit = p.get("unit_code")
            if unit: qs = qs.filter(generator_unit__code=unit)

        search = (p.get("search") or "").strip()
        if search: qs = qs.filter(Q(case_title__icontains=search) | Q(judicial_case_number__icontains=search))
        for field in ["delivery_status"]:
            val = p.get(field)
            if val: qs = qs.filter(**{field: val})
        date_from = parse_date(p.get("entry_date__gte") or "")
        date_to = parse_date(p.get("entry_date__lte") or "")
        if date_from: qs = qs.filter(entry_date__gte=date_from)
        if date_to: qs = qs.filter(entry_date__lte=date_to)
        return qs

    def _apply_personnel_filters(self, request):
        from personnel.models import Person
        qs = Person.objects.all()
        p = request.query_params

        if hasattr(self, 'is_global_viewer') and not self.is_global_viewer():
            qs = self.filter_by_unit(qs, 'unit')
        else:
            unit = p.get("unit_code")
            if unit: qs = qs.filter(unit__code=unit)
        active = self._to_bool(p.get("is_active"))
        if active is not None: qs = qs.filter(is_active=active)
        gte, lte = self._parse_dt(p.get("created_at__gte")), self._parse_dt(p.get("created_at__lte"), True)
        if gte: qs = qs.filter(created_at__gte=gte)
        if lte: qs = qs.filter(created_at__lte=lte)
        return qs

class DashboardNovedadesView(DashboardQueryMixin, views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.VIEW_DASHBOARD]

    def get(self, request):
        rows = self._apply_novedades_filters(request)
        counts = rows.aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status='OPEN')),
            critical_high=Count('id', filter=Q(severity__in=['CRITICAL', 'HIGH'])),
            closed=Count('id', filter=Q(status='CLOSED')),
        )
        total = counts['total'] or 0
        return Response({
            "module": "novedades",
            "cards": [
                {"id": "total", "label": "Total Novedades", "value": total},
                {"id": "open", "label": "Abiertas", "value": counts['open'] or 0},
                {"id": "critical_high", "label": "Criticas/Altas", "value": counts['critical_high'] or 0},
                {"id": "closed", "label": "Cerradas", "value": counts['closed'] or 0},
            ],
            "series": {
                "trend": self._trend(rows, "created_at", None),
                "distribution_primary": self._distribution(rows, "status"),
                "distribution_secondary": self._distribution(rows, "severity"),
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay novedades para los filtros seleccionados."},
        })

class DashboardHechosView(DashboardQueryMixin, views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.VIEW_DASHBOARD]

    def get(self, request):
        rows = self._apply_hechos_filters(request)
        today = timezone.localdate()
        counts = rows.aggregate(
            total=Count('id'),
            today=Count('id', filter=Q(timestamp__date=today)),
            unsolved=Count('id', filter=Q(is_solved=False)),
            solved=Count('id', filter=Q(is_solved=True)),
        )
        total = counts['total'] or 0
        return Response({
            "module": "hechos",
            "cards": [
                {"id": "total", "label": "Total Hechos", "value": total},
                {"id": "today", "label": "Hoy", "value": counts['today'] or 0},
                {"id": "unsolved", "label": "Sin Resolver", "value": counts['unsolved'] or 0},
                {"id": "solved", "label": "Resueltos", "value": counts['solved'] or 0},
            ],
            "series": {
                "trend": self._trend(rows, "timestamp", None),
                "distribution_primary": self._distribution(rows, "category"),
                "distribution_secondary": [
                    {"key": "resolved", "label": "Resueltos", "value": counts['solved'] or 0},
                    {"key": "pending", "label": "Pendientes", "value": counts['unsolved'] or 0},
                ],
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay hechos registrados. Carga hechos para habilitar analitica."},
        })

class DashboardRecordsView(DashboardQueryMixin, views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.VIEW_DASHBOARD]

    def get(self, request):
        rows = self._apply_records_filters(request)
        today = timezone.localdate()
        counts = rows.aggregate(
            total=Count('id'),
            verified=Count('id', filter=Q(is_integrity_verified=True)),
            pending=Count('id', filter=Q(is_integrity_verified=False)),
            month=Count('id', filter=Q(entry_date__month=today.month, entry_date__year=today.year)),
        )
        total = counts['total'] or 0
        return Response({
            "module": "records",
            "cards": [
                {"id": "total", "label": "Total Registros", "value": total},
                {"id": "verified", "label": "Verificados", "value": counts['verified'] or 0},
                {"id": "pending", "label": "Pendientes", "value": counts['pending'] or 0},
                {"id": "month", "label": "Mes Actual", "value": counts['month'] or 0},
            ],
            "series": {
                "trend": self._trend(rows, "entry_date", None),
                "distribution_primary": self._distribution(rows, "delivery_status"),
                "distribution_secondary": [
                    {"key": "verified", "label": "Verificados", "value": counts['verified'] or 0},
                    {"key": "unverified", "label": "No verificados", "value": counts['pending'] or 0},
                ],
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay registros filmicos para los filtros seleccionados."},
        })

class DashboardPersonnelView(DashboardQueryMixin, views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.VIEW_DASHBOARD]

    def get(self, request):
        rows = self._apply_personnel_filters(request)
        counts = rows.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True)),
            inactive=Count('id', filter=Q(is_active=False)),
        )
        total = counts['total'] or 0
        return Response({
            "module": "personnel",
            "cards": [
                {"id": "total", "label": "Total Personal", "value": total},
                {"id": "active", "label": "Activos", "value": counts['active'] or 0},
                {"id": "inactive", "label": "Inactivos", "value": counts['inactive'] or 0},
            ],
            "series": {
                "trend": self._trend(rows, "created_at", None),
                "distribution_primary": self._distribution(rows, "role"),
                "distribution_secondary": [
                    {"key": "active", "label": "Activos", "value": counts['active'] or 0},
                    {"key": "inactive", "label": "Inactivos", "value": counts['inactive'] or 0},
                ],
            },
            "totals": {"records": total},
            "empty_state": {"is_empty": total == 0, "message": "No hay personal para los filtros seleccionados."},
        })

class DashboardMapView(DashboardQueryMixin, views.APIView):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    required_permissions = [PermissionCode.VIEW_DASHBOARD]

    def get(self, request):
        from assets.models import Unit, Camera
        
        scope = (request.query_params.get("scope") or "").strip().lower()
        units_qs = Unit.objects.filter(map_enabled=True)
        
        if not self.is_global_viewer():
            person = getattr(request.user, "person", None)
            if person and person.unit:
                units_qs = units_qs.filter(id=person.unit.id)
            else:
                units_qs = units_qs.none()
        else:
            if scope == "ba": units_qs = units_qs.filter(code__in=self.BA_CODES)

        # Filtros base optimizados (reusamos la lógica de mixin pero evitamos N+1)
        nov_qs = self._apply_novedades_filters(request)
        hec_qs = self._apply_hechos_filters(request)
        rec_qs = self._apply_records_filters(request)
        per_qs = self._apply_personnel_filters(request)

        # Subconsultas para conteos por unidad (EVITA N+1)
        novedades_subquery = (
            nov_qs
            .filter(
                Q(camera__server__system__unit=OuterRef('pk'))
                | Q(server__system__unit=OuterRef('pk'))
                | Q(system__unit=OuterRef('pk'))
            )
            .order_by()
            .annotate(_group=Value(1))
            .values('_group')
            .annotate(c=Count('id', distinct=True))
            .values('c')
        )
        hechos_subquery = (
            hec_qs
            .filter(camera__server__system__unit=OuterRef('pk'))
            .order_by()
            .annotate(_group=Value(1))
            .values('_group')
            .annotate(c=Count('id'))
            .values('c')
        )
        records_subquery = (
            rec_qs
            .filter(generator_unit=OuterRef('pk'))
            .order_by()
            .annotate(_group=Value(1))
            .values('_group')
            .annotate(c=Count('id'))
            .values('c')
        )
        personnel_subquery = (
            per_qs
            .filter(unit=OuterRef('pk'))
            .order_by()
            .annotate(_group=Value(1))
            .values('_group')
            .annotate(c=Count('id'))
            .values('c')
        )
        cameras_online_subquery = (
            Camera.objects
            .filter(server__system__unit=OuterRef('pk'), status='ONLINE')
            .order_by()
            .annotate(_group=Value(1))
            .values('_group')
            .annotate(c=Count('id'))
            .values('c')
        )
        cameras_offline_subquery = (
            Camera.objects
            .filter(server__system__unit=OuterRef('pk'))
            .exclude(status='ONLINE')
            .order_by()
            .annotate(_group=Value(1))
            .values('_group')
            .annotate(c=Count('id'))
            .values('c')
        )
        
        # Últimos eventos (LIMIT 1 en subquery es eficiente)
        last_n_sub = nov_qs.filter(Q(camera__server__system__unit=OuterRef('pk'))|Q(server__system__unit=OuterRef('pk'))|Q(system__unit=OuterRef('pk'))).order_by('-created_at').values('created_at')[:1]
        last_h_sub = hec_qs.filter(camera__server__system__unit=OuterRef('pk')).order_by('-timestamp').values('timestamp')[:1]
        last_r_sub = rec_qs.filter(generator_unit=OuterRef('pk')).order_by('-created_at').values('created_at')[:1]

        units_stats = units_qs.annotate(
            n_count=Coalesce(Subquery(novedades_subquery[:1], output_field=IntegerField()), 0),
            h_count=Coalesce(Subquery(hechos_subquery[:1], output_field=IntegerField()), 0),
            r_count=Coalesce(Subquery(records_subquery[:1], output_field=IntegerField()), 0),
            p_count=Coalesce(Subquery(personnel_subquery[:1], output_field=IntegerField()), 0),
            c_online=Coalesce(Subquery(cameras_online_subquery[:1], output_field=IntegerField()), 0),
            c_offline=Coalesce(Subquery(cameras_offline_subquery[:1], output_field=IntegerField()), 0),
            last_n=Subquery(last_n_sub),
            last_h=Subquery(last_h_sub),
            last_r=Subquery(last_r_sub),
        )

        points = []
        for u in units_stats:
            if u.latitude is None or u.longitude is None: continue
            dates = [d for d in [u.last_n, u.last_h, u.last_r] if d is not None]
            last_event = max(dates) if dates else None
            points.append({
                "unit_code": u.code,
                "unit_name": u.name,
                "airport": u.airport,
                "lat": float(u.latitude),
                "lon": float(u.longitude),
                "novedades_count": u.n_count,
                "hechos_count": u.h_count,
                "records_count": u.r_count,
                "personnel_count": u.p_count,
                "cameras_online": u.c_online,
                "cameras_offline": u.c_offline,
                "last_event_at": last_event.isoformat() if last_event else None,
            })
        return Response({"scope": scope or "all", "points": points})
