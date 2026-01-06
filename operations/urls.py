from django.urls import path

from .views import HechoCreateView, HechoListView, HechoUpdateView

app_name = "operations"

urlpatterns = [
    path("hechos/", HechoListView.as_view(), name="hecho_list"),
    path("hechos/nuevo/", HechoCreateView.as_view(), name="hecho_create"),
    path("hechos/editar/<int:pk>/", HechoUpdateView.as_view(), name="hecho_update"),
]
