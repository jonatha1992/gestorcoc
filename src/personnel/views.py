from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from .models import Person


def person_list(request):
    """Lista todo el personal."""
    personnel = Person.objects.all().order_by('last_name', 'first_name')
    context = {
        'personnel': personnel,
        'title': 'Personal - GestorCOC',
        'active_page': 'personnel'
    }
    return render(request, 'personnel/person_list.html', context)


def person_detail(request, pk):
    """Muestra los detalles de una persona."""
    person = get_object_or_404(Person, pk=pk)
    context = {
        'person': person,
        'title': f'{person.first_name} {person.last_name} - Personal',
        'active_page': 'personnel'
    }
    return render(request, 'personnel/person_detail.html', context)


def person_create(request):
    """Crea un nuevo registro de personal."""
    if request.method == 'POST':
        # TODO: Implement form handling
        messages.success(request, 'Personal agregado exitosamente.')
        return redirect('personnel:list')
    
    context = {
        'title': 'Nuevo Personal - GestorCOC',
        'active_page': 'personnel'
    }
    return render(request, 'personnel/person_form.html', context)


def person_update(request, pk):
    """Actualiza un registro de personal existente."""
    person = get_object_or_404(Person, pk=pk)
    
    if request.method == 'POST':
        # TODO: Implement form handling
        messages.success(request, 'Personal actualizado exitosamente.')
        return redirect('personnel:detail', pk=person.pk)
    
    context = {
        'person': person,
        'title': f'Editar {person.first_name} {person.last_name} - Personal',
        'active_page': 'personnel'
    }
    return render(request, 'personnel/person_form.html', context)
