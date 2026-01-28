from django.urls import path
from . import views

app_name = 'novedades'

urlpatterns = [
    path('', views.novedad_list, name='list'),
    path('<int:pk>/', views.novedad_detail, name='detail'),
    path('create/', views.novedad_create, name='create'),
    path('<int:pk>/update/', views.novedad_update, name='update'),
]
