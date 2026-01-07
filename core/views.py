from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, TemplateView, UpdateView

from core.permissions import ModulePermissionRequiredMixin
from documents.models import Document
from inventory.models import Camera, Equipment
from operations.models import Hecho
from .forms import (
    CatalogForm,
    CatalogItemForm,
    CctvSystemForm,
    OrganizationalGroupForm,
    OrganizationalUnitForm,
    RoleForm,
    UserCreateForm,
    UserUpdateForm,
)
from .models import (
    Catalog,
    CatalogItem,
    CctvSystem,
    OrganizationalGroup,
    OrganizationalUnit,
    Role,
    User,
)


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


class AppLoginView(LoginView):
    template_name = "core/login.html"


class HomeView(LoginRequiredMixin, TemplateView):
    template_name = "core/home.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["stats"] = {
            "hechos": Hecho.objects.count(),
            "documents": Document.objects.count(),
            "camaras": Camera.objects.count(),
            "equipos": Equipment.objects.count(),
        }
        return context


class RoleListView(ModulePermissionRequiredMixin, ListView):
    module = "roles"
    model = Role
    template_name = "core/role_list.html"


class RoleCreateView(ModulePermissionRequiredMixin, CreateView):
    module = "roles"
    action = "create"
    model = Role
    form_class = RoleForm
    template_name = "core/role_form.html"
    success_url = reverse_lazy("core:role_list")


class RoleUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "roles"
    action = "update"
    model = Role
    form_class = RoleForm
    template_name = "core/role_form.html"
    success_url = reverse_lazy("core:role_list")


class CatalogListView(ModulePermissionRequiredMixin, ListView):
    module = "catalogos"
    model = Catalog
    template_name = "core/catalog_list.html"


class CatalogCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "catalogos"
    action = "create"
    model = Catalog
    form_class = CatalogForm
    template_name = "core/catalog_form.html"
    success_url = reverse_lazy("core:catalog_list")


class CatalogUpdateView(ModulePermissionRequiredMixin, AuditUpdateMixin, UpdateView):
    module = "catalogos"
    action = "update"
    model = Catalog
    form_class = CatalogForm
    template_name = "core/catalog_form.html"
    success_url = reverse_lazy("core:catalog_list")


class CatalogItemListView(ModulePermissionRequiredMixin, ListView):
    module = "catalogos"
    model = CatalogItem
    template_name = "core/catalog_item_list.html"

    def get_queryset(self):
        return CatalogItem.objects.filter(catalog_id=self.kwargs["catalog_id"]).select_related("catalog")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["catalog"] = Catalog.objects.get(pk=self.kwargs["catalog_id"])
        return context


class CatalogItemCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "catalogos"
    action = "create"
    model = CatalogItem
    form_class = CatalogItemForm
    template_name = "core/catalog_item_form.html"

    def get_initial(self):
        initial = super().get_initial()
        initial["catalog"] = Catalog.objects.get(pk=self.kwargs["catalog_id"])
        return initial

    def get_success_url(self):
        return reverse_lazy("core:catalog_item_list", kwargs={"catalog_id": self.kwargs["catalog_id"]})


class CatalogItemUpdateView(ModulePermissionRequiredMixin, AuditUpdateMixin, UpdateView):
    module = "catalogos"
    action = "update"
    model = CatalogItem
    form_class = CatalogItemForm
    template_name = "core/catalog_item_form.html"

    def get_success_url(self):
        return reverse_lazy("core:catalog_item_list", kwargs={"catalog_id": self.object.catalog_id})


class OrganizationalUnitListView(ModulePermissionRequiredMixin, ListView):
    module = "catalogos"
    model = OrganizationalUnit
    template_name = "core/org_unit_list.html"


class OrganizationalUnitCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "catalogos"
    action = "create"
    model = OrganizationalUnit
    form_class = OrganizationalUnitForm
    template_name = "core/org_unit_form.html"
    success_url = reverse_lazy("core:org_unit_list")


class OrganizationalUnitUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "catalogos"
    action = "update"
    model = OrganizationalUnit
    form_class = OrganizationalUnitForm
    template_name = "core/org_unit_form.html"
    success_url = reverse_lazy("core:org_unit_list")


class CctvSystemListView(ModulePermissionRequiredMixin, ListView):
    module = "catalogos"
    model = CctvSystem
    template_name = "core/cctv_system_list.html"


class CctvSystemCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "catalogos"
    action = "create"
    model = CctvSystem
    form_class = CctvSystemForm
    template_name = "core/cctv_system_form.html"
    success_url = reverse_lazy("core:cctv_system_list")


class CctvSystemUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "catalogos"
    action = "update"
    model = CctvSystem
    form_class = CctvSystemForm
    template_name = "core/cctv_system_form.html"
    success_url = reverse_lazy("core:cctv_system_list")


class OrganizationalGroupListView(ModulePermissionRequiredMixin, ListView):
    module = "catalogos"
    model = OrganizationalGroup
    template_name = "core/org_group_list.html"


class OrganizationalGroupCreateView(ModulePermissionRequiredMixin, AuditCreateMixin, CreateView):
    module = "catalogos"
    action = "create"
    model = OrganizationalGroup
    form_class = OrganizationalGroupForm
    template_name = "core/org_group_form.html"
    success_url = reverse_lazy("core:org_group_list")


class OrganizationalGroupUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "catalogos"
    action = "update"
    model = OrganizationalGroup
    form_class = OrganizationalGroupForm
    template_name = "core/org_group_form.html"
    success_url = reverse_lazy("core:org_group_list")


class UserListView(ModulePermissionRequiredMixin, ListView):
    module = "usuarios"
    model = User
    template_name = "core/user_list.html"


class UserCreateView(ModulePermissionRequiredMixin, CreateView):
    module = "usuarios"
    action = "create"
    model = User
    form_class = UserCreateForm
    template_name = "core/user_form.html"
    success_url = reverse_lazy("core:user_list")


class UserUpdateView(ModulePermissionRequiredMixin, UpdateView):
    module = "usuarios"
    action = "update"
    model = User
    form_class = UserUpdateForm
    template_name = "core/user_form.html"
    success_url = reverse_lazy("core:user_list")
