from django import forms
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import (
    Catalog,
    CatalogItem,
    CctvSystem,
    OrganizationalGroup,
    OrganizationalUnit,
    Role,
    User,
)


class TailwindFormMixin:
    def _apply_base_classes(self) -> None:
        for field in self.fields.values():
            widget = field.widget
            if isinstance(widget, (forms.CheckboxInput, forms.CheckboxSelectMultiple)):
                widget.attrs.setdefault(
                    "class", "h-4 w-4 text-indigo-600 border-gray-300 rounded"
                )
            elif isinstance(widget, forms.SelectMultiple):
                widget.attrs.setdefault(
                    "class", "w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                )
                widget.attrs.setdefault("size", "6")
            else:
                widget.attrs.setdefault(
                    "class", "w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                )
            if isinstance(widget, forms.Textarea):
                widget.attrs.setdefault("rows", "4")


class BaseModelForm(TailwindFormMixin, forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_base_classes()


class RoleForm(BaseModelForm):
    class Meta:
        model = Role
        fields = ["name", "description", "is_active", "is_system", "permissions"]


class CatalogForm(BaseModelForm):
    class Meta:
        model = Catalog
        fields = ["name", "code", "description", "is_active"]


class CatalogItemForm(BaseModelForm):
    class Meta:
        model = CatalogItem
        fields = ["catalog", "parent", "name", "code", "description", "order", "is_active"]


class OrganizationalUnitForm(BaseModelForm):
    class Meta:
        model = OrganizationalUnit
        fields = ["name", "description"]


class CctvSystemForm(BaseModelForm):
    class Meta:
        model = CctvSystem
        fields = ["unit", "name", "description", "brand", "model", "ip_address", "location"]


class OrganizationalGroupForm(BaseModelForm):
    class Meta:
        model = OrganizationalGroup
        fields = ["name", "description", "units", "systems", "role"]


class UserCreateForm(TailwindFormMixin, UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = [
            "username",
            "display_name",
            "email",
            "org_unit",
            "is_active",
            "is_staff",
            "roles",
            "org_groups",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_base_classes()


class UserUpdateForm(TailwindFormMixin, UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = [
            "username",
            "display_name",
            "email",
            "org_unit",
            "is_active",
            "is_staff",
            "roles",
            "org_groups",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("password", None)
        self._apply_base_classes()
