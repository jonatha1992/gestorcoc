from django.contrib import admin
from .models import AIUsageLog, Catalog, FilmRecord, FilmRecordInvolvedPerson


class FilmRecordInvolvedPersonInline(admin.TabularInline):
    model = FilmRecordInvolvedPerson
    extra = 0
    fields = (
        'role',
        'last_name',
        'first_name',
        'document_type',
        'document_number',
        'nationality',
        'birth_date',
    )

@admin.register(FilmRecord)
class FilmRecordAdmin(admin.ModelAdmin):
    """
    Administración completa de Registros Fílmicos con organización por secciones.
    """
    list_display = (
        'id',
        'order_number',
        'issue_number',
        'request_kind',
        'judicial_case_number',
        'judicial_office',
        'sistema',
        'entry_date',
        'delivery_status',
        'has_backup',
        'is_integrity_verified',
        'verified_by_crev_display',
        'is_editable'
    )
    
    list_filter = (
        'delivery_status',
        'has_backup',
        'is_integrity_verified',
        'is_editable',
        'request_type',
        'request_kind',
        'entry_date',
    )

    search_fields = (
        'issue_number',
        'judicial_case_number',
        'request_number',
        'case_title',
        'requester',
        'judicial_office',
        'judicial_holder',
        'dvd_number',
        'report_number',
        'expediente_number',
        'description',
        'operator__last_name',
    )

    inlines = [FilmRecordInvolvedPersonInline]
    
    date_hierarchy = 'entry_date'
    
    readonly_fields = ('is_editable', 'verification_date', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Información de Solicitud', {
            'fields': (
                'issue_number',
                'order_number',
                'entry_date',
                'request_kind',
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
                'incident_time',
                'incident_place',
                'incident_sector',
                'crime_type',
                'criminal_problematic',
                'incident_modality',
                'intervening_department',
                'generator_unit',
                'judicial_office',
                'judicial_secretary',
                'judicial_holder',
            )
        }),
        ('Sistema y Personal', {
            'fields': (
                'sistema',
                'received_by',
                'operator',
                'description',
                'dvd_number',
                'report_number',
                'ifgra_number',
                'expediente_number',
            )
        }),
        ('Entrega', {
            'fields': (
                'delivery_act_number',
                'delivery_date',
                'retrieved_by',
                'organism',
            )
        }),
        ('Referencia temporal (opcional)', {
            'fields': ('start_time', 'end_time'),
            'classes': ('collapse',)
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

@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display   = ['created_at', 'provider', 'model_name', 'endpoint', 'tokens_in', 'tokens_out', 'tokens_total']
    list_filter    = ['provider', 'endpoint', 'success']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
