from django.urls import path

from .views import (
    CameraCreateView,
    CameraListView,
    CameraUpdateView,
    EquipmentCreateView,
    EquipmentListView,
    EquipmentUpdateView,
)

app_name = "inventory"

urlpatterns = [
    path("equipamiento/", EquipmentListView.as_view(), name="equipment_list"),
    path("nuevo-equipo/", EquipmentCreateView.as_view(), name="equipment_create"),
    path("editar-equipo/<int:pk>/", EquipmentUpdateView.as_view(), name="equipment_update"),
    path("camaras/", CameraListView.as_view(), name="camera_list"),
    path("nueva-camara/", CameraCreateView.as_view(), name="camera_create"),
    path("editar-camara/<int:pk>/", CameraUpdateView.as_view(), name="camera_update"),
]
