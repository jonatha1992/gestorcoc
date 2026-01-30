from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from rest_framework import viewsets, filters
from .models import System, Server, Camera, CameramanGear, Unit
from .serializers import SystemSerializer, ServerSerializer, CameraSerializer, CameramanGearSerializer, UnitSerializer


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

# Legacy views (if needed for templates)
def home(request):
    return render(request, 'assets/home.html')


def asset_list(request):
    """Lista todos los systems y cameras."""
    systems = System.objects.all().order_by('-created_at')
    context = {
        'systems': systems,
        'title': 'Assets - GestorCOC',
        'active_page': 'assets'
    }
    return render(request, 'assets/asset_list.html', context)


def asset_detail(request, pk):
    """Muestra los detalles de un system."""
    system = get_object_or_404(System, pk=pk)
    context = {
        'system': system,
        'title': f'{system.name} - Assets',
        'active_page': 'assets'
    }
    return render(request, 'assets/asset_detail.html', context)


def asset_create(request):
    """Crea un nuevo system."""
    if request.method == 'POST':
        # TODO: Implement form handling
        messages.success(request, 'System creado exitosamente.')
        return redirect('assets:list')
    
    context = {
        'title': 'Nuevo System - GestorCOC',
        'active_page': 'assets'
    }
    return render(request, 'assets/asset_form.html', context)


def asset_update(request, pk):
    """Actualiza un system existente."""
    system = get_object_or_404(System, pk=pk)
    
    if request.method == 'POST':
        # TODO: Implement form handling
        messages.success(request, 'System actualizado exitosamente.')
        return redirect('assets:detail', pk=system.pk)
    
    context = {
        'system': system,
        'title': f'Editar {system.name} - Assets',
        'active_page': 'assets'
    }
    return render(request, 'assets/asset_form.html', context)
