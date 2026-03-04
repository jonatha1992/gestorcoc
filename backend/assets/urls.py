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
]
