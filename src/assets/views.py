from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from .models import System, Camera


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
