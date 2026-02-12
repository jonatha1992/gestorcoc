"""
URL configuration - API only.

En producción, se servirá el frontend como static files (SPA catch-all).
"""
from django.contrib import admin
from django.urls import path, include

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
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
]

