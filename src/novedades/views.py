from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from .models import Novedad


def novedad_list(request):
    """Lista todas las novedades."""
    novedades = Novedad.objects.all().order_by('-created_at')
    context = {
        'novedades': novedades,
        'title': 'Novedades - GestorCOC',
        'active_page': 'novedades'
    }
    return render(request, 'novedades/novedad_list.html', context)


def novedad_detail(request, pk):
    """Muestra los detalles de una novedad."""
    novedad = get_object_or_404(Novedad, pk=pk)
    context = {
        'novedad': novedad,
        'title': f'Novedad #{novedad.pk} - Novedades',
        'active_page': 'novedades'
    }
    return render(request, 'novedades/novedad_detail.html', context)


def novedad_create(request):
    """Crea una nueva novedad."""
    if request.method == 'POST':
        # TODO: Implement form handling
        messages.success(request, 'Novedad creada exitosamente.')
        return redirect('novedades:list')
    
    context = {
        'title': 'Nueva Novedad - GestorCOC',
        'active_page': 'novedades'
    }
    return render(request, 'novedades/novedad_form.html', context)


def novedad_update(request, pk):
    """Actualiza una novedad existente."""
    novedad = get_object_or_404(Novedad, pk=pk)
    
    if request.method == 'POST':
        # TODO: Implement form handling
        messages.success(request, 'Novedad actualizada exitosamente.')
        return redirect('novedades:detail', pk=novedad.pk)
    
    context = {
        'novedad': novedad,
        'title': f'Editar Novedad #{novedad.pk} - Novedades',
        'active_page': 'novedades'
    }
    return render(request, 'novedades/novedad_form.html', context)
