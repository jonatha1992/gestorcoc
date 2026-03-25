from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from personnel.access import PermissionCode
from personnel.permissions import ActionPermissionMixin, HasNamedPermission
from core.mixins import UnitFilterMixin
from django.db.models import Q
from .models import Novedad
from .serializers import NovedadSerializer


class NovedadViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Novedad.objects.select_related(
        'camera', 'server', 'system', 'cameraman_gear'
    )
    serializer_class = NovedadSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list": [PermissionCode.VIEW_NOVEDADES],
        "retrieve": [PermissionCode.VIEW_NOVEDADES],
        "create": [PermissionCode.MANAGE_NOVEDADES],
        "update": [PermissionCode.MANAGE_NOVEDADES],
        "partial_update": [PermissionCode.MANAGE_NOVEDADES],
        "destroy": [PermissionCode.MANAGE_NOVEDADES],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'status': ['exact'],
        'severity': ['exact'],
        'incident_type': ['exact'],
        'created_at': ['gte', 'lte'],
        'reported_by': ['exact'],
        'camera': ['exact'],
        'server': ['exact'],
        'system': ['exact'],
        'cameraman_gear': ['exact'],
        'coc_ticket_number': ['icontains'],
    }
    search_fields = [
        'description',
        'camera__name',
        'server__name',
        'system__name',
        'cameraman_gear__name',
        'reporter_name',
        'reported_by__first_name',
        'reported_by__last_name',
    ]
    ordering_fields = ['created_at', 'severity', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if not self.is_global_viewer():
            person = getattr(user, 'person', None)
            if person and person.unit:
                queryset = queryset.filter(
                    Q(camera__server__system__unit=person.unit) |
                    Q(server__system__unit=person.unit) |
                    Q(system__unit=person.unit) |
                    Q(cameraman_gear__assigned_to__unit=person.unit)
                ).distinct()
            else:
                queryset = queryset.none()

        asset_type = (self.request.query_params.get('asset_type') or '').strip().upper()

        if asset_type == 'CAMERA':
            queryset = queryset.filter(camera__isnull=False)
        elif asset_type == 'SERVER':
            queryset = queryset.filter(server__isnull=False)
        elif asset_type == 'SYSTEM':
            queryset = queryset.filter(system__isnull=False)
        elif asset_type == 'GEAR':
            queryset = queryset.filter(cameraman_gear__isnull=False)

        return queryset

    def perform_create(self, serializer):
        person = getattr(self.request.user, "person", None)
        if person is not None and not serializer.validated_data.get("reported_by"):
            serializer.save(reported_by=person, reporter_name="")
            return
        serializer.save()
