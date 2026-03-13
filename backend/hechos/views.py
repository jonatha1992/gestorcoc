from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from personnel.access import PermissionCode
from personnel.permissions import ActionPermissionMixin, HasNamedPermission
from .models import Hecho
from .serializers import HechoSerializer


class HechoViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Hecho.objects.select_related('camera').order_by('-timestamp')
    serializer_class = HechoSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list": [PermissionCode.VIEW_HECHOS],
        "retrieve": [PermissionCode.VIEW_HECHOS],
        "create": [PermissionCode.MANAGE_HECHOS],
        "update": [PermissionCode.MANAGE_HECHOS],
        "partial_update": [PermissionCode.MANAGE_HECHOS],
        "destroy": [PermissionCode.MANAGE_HECHOS],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'category': ['exact'],
        'is_solved': ['exact'],
        'camera': ['exact'],
        'timestamp': ['gte', 'lte'],
        'coc_intervention': ['exact'],
        'generated_cause': ['exact'],
    }
    search_fields = ['description', 'sector', 'external_ref', 'elements']
    ordering_fields = ['timestamp', 'category', 'is_solved']
    ordering = ['-timestamp']

    def perform_create(self, serializer):
        person = getattr(self.request.user, "person", None)
        if person is not None and not serializer.validated_data.get("reported_by"):
            serializer.save(reported_by=person)
            return
        serializer.save()
