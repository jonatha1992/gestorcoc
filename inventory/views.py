from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, UpdateView

from core.permissions import ModulePermissionRequiredMixin
from .forms import CameraForm, EquipmentForm
from .models import Camera, Equipment


class AuditCreateMixin:
    def form_valid(self, form):
        if hasattr(form.instance, "created_by") and not form.instance.created_by:
            form.instance.created_by = self.request.user
        return super().form_valid(form)


class AuditUpdateMixin:
    def form_valid(self, form):
        if hasattr(form.instance, "updated_by"):
            form.instance.updated_by = self.request.user
        return super().form_valid(form)


class EquipmentListView(ModulePermissionRequiredMixin, ListView):
    module = "equipamiento"
    model = Equipment
    template_name = "inventory/equipment_list.html"

    def get_queryset(self):
        return Equipment.objects.select_related("category", "location", "org_unit")


class EquipmentCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "equipamiento"
    action = "create"
    model = Equipment
    form_class = EquipmentForm
    template_name = "inventory/equipment_form.html"
    success_url = reverse_lazy("inventory:equipment_list")


class EquipmentUpdateView(ModulePermissionRequiredMixin, AuditUpdateMixin, UpdateView):
    module = "equipamiento"
    action = "update"
    model = Equipment
    form_class = EquipmentForm
    template_name = "inventory/equipment_form.html"
    success_url = reverse_lazy("inventory:equipment_list")


class CameraListView(ModulePermissionRequiredMixin, ListView):
    module = "camaras"
    model = Camera
    template_name = "inventory/camera_list.html"

    def get_queryset(self):
        return Camera.objects.select_related("location", "camera_type", "org_unit", "org_system")


class CameraCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "camaras"
    action = "create"
    model = Camera
    form_class = CameraForm
    template_name = "inventory/camera_form.html"
    success_url = reverse_lazy("inventory:camera_list")


class CameraUpdateView(ModulePermissionRequiredMixin, AuditUpdateMixin, UpdateView):
    module = "camaras"
    action = "update"
    model = Camera
    form_class = CameraForm
    template_name = "inventory/camera_form.html"
    success_url = reverse_lazy("inventory:camera_list")
