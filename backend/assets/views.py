from rest_framework import viewsets, filters
from .models import System, Server, Camera, CameramanGear, Unit
from .serializers import (
    SystemSerializer, ServerSerializer, CameraSerializer,
    CameramanGearSerializer, UnitSerializer,
)


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']


class SystemViewSet(viewsets.ModelViewSet):
    queryset = System.objects.all()
    serializer_class = SystemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'system_type', 'unit__name', 'unit__code']


class ServerViewSet(viewsets.ModelViewSet):
    queryset = Server.objects.all()
    serializer_class = ServerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'ip_address', 'system__name']


class CameraViewSet(viewsets.ModelViewSet):
    queryset = Camera.objects.all()
    serializer_class = CameraSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'ip_address', 'server__name', 'status']


class CameramanGearViewSet(viewsets.ModelViewSet):
    queryset = CameramanGear.objects.all()
    serializer_class = CameramanGearSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'serial_number', 'assigned_to']
