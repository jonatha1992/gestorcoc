from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    permissions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Catalog(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="catalogs_created",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="catalogs_updated",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class CatalogItem(models.Model):
    catalog = models.ForeignKey(Catalog, on_delete=models.CASCADE, related_name="items")
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="catalog_items_created",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="catalog_items_updated",
    )

    class Meta:
        ordering = ["catalog", "order", "name"]

    def __str__(self) -> str:
        return self.name


class OrganizationalUnit(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="org_units_created",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class CctvSystem(models.Model):
    unit = models.ForeignKey(OrganizationalUnit, on_delete=models.CASCADE, related_name="systems")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cctv_systems_created",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class OrganizationalGroup(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    units = models.ManyToManyField(OrganizationalUnit, blank=True, related_name="groups")
    systems = models.ManyToManyField(CctvSystem, blank=True, related_name="groups")
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="org_groups_created",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    display_name = models.CharField(max_length=150, blank=True)
    roles = models.ManyToManyField(Role, blank=True, related_name="users")
    org_groups = models.ManyToManyField(OrganizationalGroup, blank=True, related_name="users")

    def __str__(self) -> str:
        return self.get_display_name()

    def get_display_name(self) -> str:
        return self.display_name or self.get_full_name() or self.username

    def primary_role_name(self) -> str:
        role = self.roles.first()
        return role.name if role else ""
