from django.contrib import admin
from .models import Novedad

@admin.register(Novedad)
class NovedadAdmin(admin.ModelAdmin):
    list_display = ('incident_type', 'camera', 'severity', 'status', 'coc_ticket_number', 'created_at')
    list_filter = ('severity', 'status')
    search_fields = ('description', 'coc_ticket_number')
    list_per_page = 20
