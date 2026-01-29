from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'systems', views.SystemViewSet)
router.register(r'cameras', views.CameraViewSet)

app_name = 'assets'

urlpatterns = [
    path('', include(router.urls)),
    # path('', views.home, name='home'),
]
