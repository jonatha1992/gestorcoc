from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, UpdateView

from core.permissions import ModulePermissionRequiredMixin
from .forms import HechoForm
from .models import Hecho


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


class HechoListView(ModulePermissionRequiredMixin, ListView):
    module = "hechos"
    model = Hecho
    template_name = "operations/hecho_list.html"


class HechoCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "hechos"
    action = "create"
    model = Hecho
    form_class = HechoForm
    template_name = "operations/hecho_form.html"
    success_url = reverse_lazy("operations:hecho_list")


class HechoUpdateView(ModulePermissionRequiredMixin, AuditUpdateMixin, UpdateView):
    module = "hechos"
    action = "update"
    model = Hecho
    form_class = HechoForm
    template_name = "operations/hecho_form.html"
    success_url = reverse_lazy("operations:hecho_list")
