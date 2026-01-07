from django.contrib import admin

from .models import Camera, CameraInventoryRecord, CameraUpdate, Equipment, EquipmentRegister, EquipmentRegisterItem


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "serial_number", "org_unit")
    list_filter = ("status",)
    search_fields = ("name", "serial_number", "brand", "model")


class EquipmentRegisterItemInline(admin.TabularInline):
    model = EquipmentRegisterItem
    extra = 0
    fields = ("section_label", "description", "brand_model", "serial_number", "units", "unit_status", "delivered")


@admin.register(EquipmentRegister)
class EquipmentRegisterAdmin(admin.ModelAdmin):
    list_display = ("source_name", "service_date_text", "service_order", "created_at")
    search_fields = ("source_name", "service_order")
    inlines = [EquipmentRegisterItemInline]


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


@admin.register(CameraInventoryRecord)
class CameraInventoryRecordAdmin(admin.ModelAdmin):
    list_display = ("device_name", "server_name", "ip_address", "firmware_version", "state")
    list_filter = ("server_name", "state", "vendor")
    search_fields = ("device_name", "serial_number", "ip_address", "camera_id")
