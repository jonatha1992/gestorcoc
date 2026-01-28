from django.contrib import admin
from .models import Novedad

@admin.register(Novedad)
class NovedadAdmin(admin.ModelAdmin):
    list_display = ('incident_type', 'camera', 'severity', 'status', 'reported_by', 'created_at')
    list_filter = ('severity', 'status')
    search_fields = ('description', 'external_ticket_id')
