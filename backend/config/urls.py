"""
URL configuration - API + SPA catch-all.
"""
from pathlib import Path
import os
import re
import subprocess

from django.conf import settings
from django.contrib import admin
from django.http import Http404, HttpResponse, JsonResponse
from django.urls import include, path, re_path

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny


def version_json(request):
    root = Path(__file__).resolve().parents[2]
    version = os.environ.get('APP_VERSION', '0.1.0')
    for candidate in (root / 'VERSION', root / 'pyproject.toml'):
        if candidate.is_file():
            text = candidate.read_text(encoding='utf-8')
            match = re.search(r"(?m)^version\s*=\s*['\"]([^'\"]+)", text) if candidate.suffix == '.toml' else re.search(r'\S+', text)
            if match:
                version = match.group(1)
                break
    if not re.fullmatch(r'\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?', version):
        version = '0.1.0'
    sha = os.environ.get('GIT_SHA', '')
    if not re.fullmatch(r'[0-9a-fA-F]{7,40}', sha):
        try:
            sha = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
        except (OSError, subprocess.CalledProcessError):
            sha = 'unknown'
    return JsonResponse({'version': version, 'sha': sha[:7]})


def spa_index(request):
    """Sirve index.html de Angular para todas las rutas no-API (SPA catch-all)."""
    index = Path(settings.BASE_DIR).parent / 'frontend' / 'dist' / 'gestor-coc' / 'browser' / 'index.html'
    if not index.exists():
        raise Http404('Angular build not found. Run ng build first.')
    return HttpResponse(index.read_bytes(), content_type='text/html; charset=utf-8')


def trigger_seed(request):
    """Endpoint secreto para sembrar base de datos vía HTTP e ignorar firewalls."""
    from django.core.management import call_command
    import traceback
    try:
        call_command('seed_data')
        return JsonResponse({'status': 'ok', 'message': '¡Base de datos sembrada con exito!'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e), 'trace': traceback.format_exc()}, status=500)


def health_check(request):
    """Endpoint minimalista para el health check de Railway."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('version.json', version_json, name='version-json'),
    path('api/health/', health_check, name='health-check'),
    path('api/admin/run-seed/', trigger_seed, name='trigger-seed'),
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(authentication_classes=[], permission_classes=[AllowAny]), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema', authentication_classes=[], permission_classes=[AllowAny]), name='swagger-ui'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema', authentication_classes=[], permission_classes=[AllowAny]), name='swagger-ui-alt'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema', authentication_classes=[], permission_classes=[AllowAny]), name='redoc'),
    path('api/auth/', include('personnel.auth_urls')),
    path('api/', include('core.urls')),
    path('api/', include('assets.urls')),
    path('api/', include('novedades.urls')),
    path('api/', include('personnel.urls')),
    path('api/', include('records.urls')),
    path('api/', include('hechos.urls')),
    # SPA catch-all — debe ir último. WhiteNoise intercepta archivos reales antes de llegar aquí.
    re_path(r'^(?!api/|admin/|swagger/|static/).*$', spa_index),
]

