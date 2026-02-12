from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'novedades', views.NovedadViewSet)

app_name = 'novedades'

urlpatterns = [
    path('', include(router.urls)),
    # Rutas de vistas de template (UI)
    path('novedades/', views.novedad_list, name='list'),
    path('novedades/create/', views.novedad_create, name='create'),
    path('novedades/<int:pk>/', views.novedad_detail, name='detail'),
    path('novedades/<int:pk>/edit/', views.novedad_update, name='update'),
]
