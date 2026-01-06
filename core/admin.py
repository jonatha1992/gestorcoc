from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    Catalog,
    CatalogItem,
    CctvSystem,
    OrganizationalGroup,
    OrganizationalUnit,
    Role,
    User,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profile", {"fields": ("display_name", "roles", "org_groups")}),
    )
    list_display = ("username", "display_name", "email", "is_active", "is_staff")
    search_fields = ("username", "display_name", "email")
    filter_horizontal = ("roles", "org_groups")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "is_system")
    search_fields = ("name",)


@admin.register(Catalog)
class CatalogAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")
    search_fields = ("name", "code")


@admin.register(CatalogItem)
class CatalogItemAdmin(admin.ModelAdmin):
    list_display = ("name", "catalog", "order", "is_active")
    list_filter = ("catalog",)
    search_fields = ("name", "code")


@admin.register(OrganizationalUnit)
class OrganizationalUnitAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(CctvSystem)
class CctvSystemAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "ip_address")
    list_filter = ("unit",)
    search_fields = ("name", "ip_address")


@admin.register(OrganizationalGroup)
class OrganizationalGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "role")
    search_fields = ("name",)
    filter_horizontal = ("units", "systems")
