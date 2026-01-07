from django.conf import settings
from django.db import models

from core.models import CatalogItem, CctvSystem, OrganizationalUnit


class EquipmentStatus(models.TextChoices):
    AVAILABLE = "Disponible", "Disponible"
    REPAIR = "En Reparacion", "En Reparacion"
    DELIVERED = "Entregado", "Entregado"
    RETIRED = "Baja", "Baja"


class Equipment(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        CatalogItem,
        on_delete=models.PROTECT,
        related_name="equipment_categories",
    )
    location = models.ForeignKey(
        CatalogItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment_locations",
    )
    parent_equipment = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    serial_number = models.CharField(max_length=120, blank=True)
    brand = models.CharField(max_length=120, blank=True)
    model = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=20, choices=EquipmentStatus.choices, default=EquipmentStatus.AVAILABLE, db_index=True)
    description = models.TextField(blank=True)
    qr_code = models.CharField(max_length=200, blank=True)
    org_unit = models.ForeignKey(
        OrganizationalUnit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment_created",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment_updated",
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:
        return self.name


class EquipmentRegister(models.Model):
    source_name = models.CharField(max_length=255)
    checksum = models.CharField(max_length=64, blank=True)
    service_date_text = models.CharField(max_length=120, blank=True)
    service_date = models.DateField(null=True, blank=True)
    service_order = models.CharField(max_length=120, blank=True)
    deployment = models.CharField(max_length=200, blank=True)
    allanamiento = models.CharField(max_length=200, blank=True)
    police_procedure = models.CharField(max_length=200, blank=True)
    other_notes = models.CharField(max_length=200, blank=True)
    raw_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["source_name"])]

    def __str__(self) -> str:
        return f"{self.source_name} ({self.service_date_text})"


class EquipmentRegisterItem(models.Model):
    register = models.ForeignKey(EquipmentRegister, on_delete=models.CASCADE, related_name="items")
    section_label = models.CharField(max_length=150, blank=True)
    description = models.CharField(max_length=255)
    brand_model = models.CharField(max_length=200, blank=True)
    serial_number = models.CharField(max_length=180, blank=True)
    units = models.CharField(max_length=50, blank=True)
    unit_status = models.CharField(max_length=80, blank=True)
    delivered = models.CharField(max_length=50, blank=True)
    observations = models.CharField(max_length=255, blank=True)
    raw_row = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:
        return self.description


class CameraStatus(models.TextChoices):
    ONLINE = "Operativa", "Operativa"
    ISSUE = "Con Falla", "Con Falla"
    OFFLINE = "Fuera de Servicio", "Fuera de Servicio"
    MAINTENANCE = "Mantenimiento", "Mantenimiento"


class Camera(models.Model):
    name = models.CharField(max_length=200)
    location = models.ForeignKey(
        CatalogItem,
        on_delete=models.PROTECT,
        related_name="camera_locations",
    )
    camera_type = models.ForeignKey(
        CatalogItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="camera_types",
    )
    status = models.CharField(max_length=30, choices=CameraStatus.choices, default=CameraStatus.ONLINE, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    serial_number = models.CharField(max_length=120, blank=True)
    brand = models.CharField(max_length=120, blank=True)
    model = models.CharField(max_length=120, blank=True)
    installation_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    org_unit = models.ForeignKey(
        OrganizationalUnit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cameras",
    )
    org_system = models.ForeignKey(
        CctvSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cameras",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cameras_created",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cameras_updated",
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["location"]),
            models.Index(fields=["org_unit"]),
        ]

    def __str__(self) -> str:
        return self.name


class CameraUpdateType(models.TextChoices):
    ISSUE = "Falla", "Falla"
    REPAIR = "Reparacion", "Reparacion"
    MAINTENANCE = "Mantenimiento", "Mantenimiento"
    NOTE = "Observacion", "Observacion"


class CameraUpdateStatus(models.TextChoices):
    OPEN = "Abierta", "Abierta"
    CLOSED = "Cerrada", "Cerrada"


class CameraUpdate(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name="updates")
    update_type = models.CharField(max_length=20, choices=CameraUpdateType.choices)
    description = models.TextField()
    date = models.DateField()
    reported_by = models.CharField(max_length=150)
    resolved_at = models.DateField(null=True, blank=True)
    resolved_by = models.CharField(max_length=150, blank=True)
    resolution_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=CameraUpdateStatus.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="camera_updates_created",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="camera_updates_updated",
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"{self.camera} - {self.update_type}"


class CameraInventoryRecord(models.Model):
    source_name = models.CharField(max_length=255)
    server_name = models.CharField(max_length=120, blank=True)
    device_name = models.CharField(max_length=200)
    vendor = models.CharField(max_length=120, blank=True)
    model = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=200, blank=True)
    logical_id = models.CharField(max_length=120, blank=True)
    device_id = models.CharField(max_length=255, blank=True)
    camera_id = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    mac_address = models.CharField(max_length=50, blank=True)
    firmware_version = models.CharField(max_length=120, blank=True)
    firmware_required = models.CharField(max_length=120, blank=True)
    serial_number = models.CharField(max_length=120, blank=True)
    connected = models.BooleanField(default=False)
    visible = models.BooleanField(default=False)
    error_indicators = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=120, blank=True)
    bitrate_kbps = models.IntegerField(null=True, blank=True)
    resolution = models.CharField(max_length=50, blank=True)
    quality = models.CharField(max_length=50, blank=True)
    frame_rate = models.CharField(max_length=50, blank=True)
    encryption = models.CharField(max_length=80, blank=True)
    retention = models.CharField(max_length=120, blank=True)
    appearance_search = models.CharField(max_length=120, blank=True)
    face_recognition = models.CharField(max_length=120, blank=True)
    raw_row = models.JSONField(default=dict, blank=True)
    imported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["server_name", "device_name"]
        indexes = [models.Index(fields=["server_name", "device_name"])]

    def __str__(self) -> str:
        return f"{self.device_name} ({self.server_name})"
