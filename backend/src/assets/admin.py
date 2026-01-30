from django.contrib import admin
from .models import System, Server, Camera, Unit

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'updated_at')

@admin.register(System)
class SystemAdmin(admin.ModelAdmin):
    list_display = ('name', 'system_type', 'unit', 'is_active', 'updated_at')
    list_filter = ('system_type', 'is_active', 'unit')

@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ('name', 'system', 'ip_address', 'is_active')
    list_filter = ('system', 'is_active')
    search_fields = ('name', 'ip_address')

@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ('name', 'server', 'ip_address', 'status', 'resolution')
    list_filter = ('status', 'server__system', 'server')
    search_fields = ('name', 'ip_address')
