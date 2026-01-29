from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'people', views.PersonViewSet)

app_name = 'personnel'

urlpatterns = [
    path('', include(router.urls)),
    # path('', views.home, name='home'),
]
