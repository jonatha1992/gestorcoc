from rest_framework import viewsets, filters
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from personnel.access import PermissionCode
from personnel.permissions import ActionPermissionMixin, HasNamedPermission
from core.mixins import UnitFilterMixin
from .models import System, Server, Camera, CameramanGear, Unit
from .serializers import (
    SystemSerializer, ServerSerializer, CameraSerializer,
    CameramanGearSerializer, UnitSerializer,
)


ASSET_ACTION_PERMISSIONS = {
    'list': [PermissionCode.VIEW_ASSETS],
    'retrieve': [PermissionCode.VIEW_ASSETS],
    'create': [PermissionCode.MANAGE_ASSETS],
    'update': [PermissionCode.MANAGE_ASSETS],
    'partial_update': [PermissionCode.MANAGE_ASSETS],
    'destroy': [PermissionCode.MANAGE_ASSETS],
}


class UnitViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = ASSET_ACTION_PERMISSIONS
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {'parent': ['exact']}
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'airport']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.is_global_viewer():
            return queryset
        
        person = getattr(self.request.user, 'person', None)
        if person and person.unit:
            # Operadores solo ven su propia unidad
            return queryset.filter(id=person.unit.id)
        return queryset.none()


class SystemViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = System.objects.select_related('unit').prefetch_related(
        'servers',
        'servers__cameras',
    ).all()
    serializer_class = SystemSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = ASSET_ACTION_PERMISSIONS
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'unit': ['exact'],
        'unit__code': ['exact'],
        'system_type': ['exact'],
        'is_active': ['exact'],
    }
    search_fields = ['name', 'system_type', 'unit__name', 'unit__code']
    ordering_fields = ['name', 'created_at', 'system_type']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        return self.filter_by_unit(queryset, 'unit')


class ServerViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Server.objects.all()
    serializer_class = ServerSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = ASSET_ACTION_PERMISSIONS
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'system': ['exact'],
        'is_active': ['exact'],
    }
    search_fields = ['name', 'ip_address', 'system__name']
    ordering_fields = ['name', 'created_at', 'ip_address']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        return self.filter_by_unit(queryset, 'system__unit')


class CameraViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
    # select_related evita N+1 queries: el serializer accede a server.name, server.system.name y server.system.id
    queryset = Camera.objects.select_related('server', 'server__system').all()
    serializer_class = CameraSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = ASSET_ACTION_PERMISSIONS
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'server': ['exact'],
        'status': ['exact'],
    }
    search_fields = ['name', 'ip_address', 'server__name', 'status']
    ordering_fields = ['name', 'status', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        return self.filter_by_unit(queryset, 'server__system__unit')


class CameramanGearViewSet(UnitFilterMixin, ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = CameramanGear.objects.all()
    serializer_class = CameramanGearSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = ASSET_ACTION_PERMISSIONS
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'condition': ['exact'],
        'is_active': ['exact'],
        'assigned_to': ['exact'],
    }
    search_fields = ['name', 'serial_number', 'assigned_to_name', 'assigned_to__first_name', 'assigned_to__last_name']
    ordering_fields = ['name', 'condition', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Fallback al creador/asignado
        return self.filter_by_unit(queryset, 'assigned_to__unit')
