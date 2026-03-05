"""
URL configuration - API + SPA catch-all.
"""
from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.http import Http404, HttpResponse, JsonResponse
from django.urls import include, path, re_path

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def spa_index(request):
    """Sirve index.html de Angular para todas las rutas no-API (SPA catch-all)."""
    index = Path(settings.BASE_DIR).parent / 'frontend' / 'dist' / 'gestor-coc' / 'browser' / 'index.html'
    if not index.exists():
        raise Http404('Angular build not found. Run ng build first.')
    return HttpResponse(index.read_bytes(), content_type='text/html; charset=utf-8')


def health_check(request):
    """Endpoint minimalista para el health check de Railway."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-alt'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/', include('assets.urls')),
    path('api/', include('novedades.urls')),
    path('api/', include('personnel.urls')),
    path('api/', include('records.urls')),
    path('api/', include('hechos.urls')),
    # SPA catch-all — debe ir último. WhiteNoise intercepta archivos reales antes de llegar aquí.
    re_path(r'^(?!api/|admin/|swagger/|static/).*$', spa_index),
]

