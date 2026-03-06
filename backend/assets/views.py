from rest_framework import viewsets, filters
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import System, Server, Camera, CameramanGear, Unit
from .serializers import (
    SystemSerializer, ServerSerializer, CameraSerializer,
    CameramanGearSerializer, UnitSerializer,
)


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {'parent': ['exact']}
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'airport']
    ordering = ['name']


class SystemViewSet(viewsets.ModelViewSet):
    queryset = System.objects.select_related('unit').prefetch_related(
        'servers',
        'servers__cameras',
    ).all()
    serializer_class = SystemSerializer
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


class ServerViewSet(viewsets.ModelViewSet):
    queryset = Server.objects.all()
    serializer_class = ServerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'system': ['exact'],
        'is_active': ['exact'],
    }
    search_fields = ['name', 'ip_address', 'system__name']
    ordering_fields = ['name', 'created_at', 'ip_address']
    ordering = ['name']


class CameraViewSet(viewsets.ModelViewSet):
    # select_related evita N+1 queries: el serializer accede a server.name, server.system.name y server.system.id
    queryset = Camera.objects.select_related('server', 'server__system').all()
    serializer_class = CameraSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'server': ['exact'],
        'status': ['exact'],
    }
    search_fields = ['name', 'ip_address', 'server__name', 'status']
    ordering_fields = ['name', 'status', 'created_at']
    ordering = ['name']


class CameramanGearViewSet(viewsets.ModelViewSet):
    queryset = CameramanGear.objects.all()
    serializer_class = CameramanGearSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, OrderingFilter]
    filterset_fields = {
        'condition': ['exact'],
        'is_active': ['exact'],
        'assigned_to': ['exact'],
    }
    search_fields = ['name', 'serial_number', 'assigned_to_name', 'assigned_to__first_name', 'assigned_to__last_name']
    ordering_fields = ['name', 'condition', 'created_at']
    ordering = ['name']
