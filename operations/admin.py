from django.contrib import admin

from .models import Hecho


@admin.register(Hecho)
class HechoAdmin(admin.ModelAdmin):
    list_display = (
        "nro_orden",
        "fecha_intervencion",
        "quien_detecta",
        "status",
        "org_unit",
        "cctv_system",
        "camera",
        "resolved_group",
        "resolved_at",
        "tiempo_resolucion_legible",
    )
    search_fields = ("nro_orden", "novedad", "sector")
    list_filter = ("quien_detecta", "genero_causa", "solucionado_coc", "status", "cctv_system", "resolved_group")
