from django.contrib import admin
from .models import System, Camera

@admin.register(System)
class SystemAdmin(admin.ModelAdmin):
    list_display = ('name', 'ip_address', 'is_active', 'updated_at')

@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ('name', 'system', 'ip_address', 'status', 'resolution')
    list_filter = ('status', 'system')
    search_fields = ('name', 'ip_address')
