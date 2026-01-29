from django.contrib import admin
from .models import FilmRecord, Catalog

@admin.register(FilmRecord)
class FilmRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'camera', 'operator', 'start_time', 'record_type', 'is_verified')
    list_filter = ('record_type', 'is_verified', 'camera__system')
    search_fields = ('description', 'camera__name', 'operator__last_name')
    date_hierarchy = 'start_time'

@admin.register(Catalog)
class CatalogAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
