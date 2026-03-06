from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Novedad
from .serializers import NovedadSerializer


class NovedadViewSet(viewsets.ModelViewSet):
    queryset = Novedad.objects.select_related(
        'camera', 'server', 'system', 'cameraman_gear'
    )
    serializer_class = NovedadSerializer
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
