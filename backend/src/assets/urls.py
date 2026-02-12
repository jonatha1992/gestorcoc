from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'systems', views.SystemViewSet)
router.register(r'servers', views.ServerViewSet)
router.register(r'cameras', views.CameraViewSet)
router.register(r'cameraman-gear', views.CameramanGearViewSet)
router.register(r'units', views.UnitViewSet)

app_name = 'assets'

urlpatterns = [
    path('', include(router.urls)),
    # Rutas de vistas de template (UI)
    path('assets/', views.asset_list, name='list'),
    path('assets/create/', views.asset_create, name='create'),
    path('assets/<int:pk>/', views.asset_detail, name='detail'),
    path('assets/<int:pk>/edit/', views.asset_update, name='update'),
]
