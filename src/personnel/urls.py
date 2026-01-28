from django.urls import path
from . import views

app_name = 'personnel'

urlpatterns = [
    path('', views.person_list, name='list'),
    path('<int:pk>/', views.person_detail, name='detail'),
    path('create/', views.person_create, name='create'),
    path('<int:pk>/update/', views.person_update, name='update'),
]
