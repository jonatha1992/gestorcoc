from django.contrib import admin

from .models import Camera, CameraUpdate, Equipment


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "serial_number", "org_unit")
    list_filter = ("status",)
    search_fields = ("name", "serial_number", "brand", "model")


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "ip_address", "org_unit", "org_system")
    list_filter = ("status",)
    search_fields = ("name", "ip_address", "serial_number")


@admin.register(CameraUpdate)
class CameraUpdateAdmin(admin.ModelAdmin):
    list_display = ("camera", "update_type", "status", "date")
    list_filter = ("update_type", "status")
    search_fields = ("camera__name",)
