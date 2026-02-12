from django.contrib import admin
from .models import FilmRecord, Catalog

@admin.register(FilmRecord)
class FilmRecordAdmin(admin.ModelAdmin):
    """
    Administración completa de Registros Fílmicos con organización por secciones.
    """
    list_display = (
        'id', 
        'issue_number',
        'judicial_case_number', 
        'camera', 
        'entry_date',
        'delivery_status',
        'has_backup', 
        'is_integrity_verified',
        'verified_by_crev_display',
        'is_editable'
    )
    
    list_filter = (
        'record_type', 
        'delivery_status',
        'has_backup',
        'is_integrity_verified', 
        'is_editable',
        'request_type',
        'entry_date',
        'camera__server__system'
    )
    
    search_fields = (
        'issue_number',
        'judicial_case_number',
        'request_number',
        'case_title',
        'requester',
        'description', 
        'camera__name', 
        'operator__last_name',
    )
    
    date_hierarchy = 'entry_date'
    
    readonly_fields = ('is_editable', 'verification_date', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Información de Solicitud', {
            'fields': (
                'issue_number',
                'order_number',
                'entry_date',
                'request_type',
                'request_number',
                'requester',
            )
        }),
        ('Información Judicial', {
            'fields': (
                'judicial_case_number',
                'case_title',
                'incident_date',
                'crime_type',
                'intervening_department',
            )
        }),
        ('Datos del Registro', {
            'fields': (
                'camera',
                'operator',
                'received_by',
                'start_time',
                'end_time',
                'record_type',
                'description',
            )
        }),
        ('Gestión de Archivos y Backup', {
            'fields': (
                'has_backup',
                'backup_path',
                'file_hash',
                'file_size',
                'is_integrity_verified',
            ),
            'classes': ('collapse',)
        }),
        ('Verificación CREV', {
            'fields': (
                'verified_by_crev',
                'verification_date',
                'is_editable',
            ),
            'classes': ('collapse',)
        }),
        ('Estado y Observaciones', {
            'fields': (
                'delivery_status',
                'observations',
            )
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def verified_by_crev_display(self, obj):
        """Muestra el nombre del verificador CREV o un indicador si está pendiente"""
        if obj.verified_by_crev:
            return f"✓ {obj.verified_by_crev.last_name}"
        return "✗ Pendiente"
    verified_by_crev_display.short_description = "Verificado por CREV"

@admin.register(Catalog)
class CatalogAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
