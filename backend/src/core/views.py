from django.shortcuts import render
from assets.models import System
from novedades.models import Novedad
from personnel.models import Person

def home(request):
    """Página principal del dashboard con resumen del sistema."""
    context = {
        'title': 'Dashboard - GestorCOC',
        'active_page': 'dashboard',
        'assets_count': System.objects.count(),
        'novedades_count': Novedad.objects.filter(status='OPEN').count(),
        'personnel_count': Person.objects.filter(is_active=True).count(),
    }
    return render(request, 'core/dashboard.html', context)
