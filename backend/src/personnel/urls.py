from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'people', views.PersonViewSet)

app_name = 'personnel'

urlpatterns = [
    path('', include(router.urls)),
    # Rutas de vistas de template (UI)
    path('people/', views.person_list, name='list'),
    path('people/create/', views.person_create, name='create'),
    path('people/<int:pk>/', views.person_detail, name='detail'),
    path('people/<int:pk>/edit/', views.person_update, name='update'),
]
