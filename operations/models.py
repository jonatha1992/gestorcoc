from django.conf import settings
from django.db import models


class Detector(models.TextChoices):
    GUARDIA = "Guardia de Prevencion", "Guardia de Prevencion"
    MONITOREO = "Centro Monitoreo", "Centro Monitoreo"


class Hecho(models.Model):
    nro_orden = models.PositiveIntegerField(db_index=True)
    fecha_intervencion = models.DateTimeField(db_index=True)
    novedad = models.CharField(max_length=200, blank=True)
    quien_detecta = models.CharField(max_length=50, choices=Detector.choices)
    elementos = models.CharField(max_length=200, blank=True)
    sector = models.CharField(max_length=200, blank=True)
    solucionado_coc = models.BooleanField(default=False)
    genero_causa = models.BooleanField(default=False)
    hs_resolucion = models.CharField(max_length=120, blank=True)
    detalle_cierre = models.TextField(blank=True)
    sugerencia = models.CharField(max_length=200, blank=True)
    falencia = models.CharField(max_length=200, blank=True)
    observaciones = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos_created",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos_updated",
    )

    class Meta:
        ordering = ["-fecha_intervencion"]
        indexes = [
            models.Index(fields=["fecha_intervencion"]),
            models.Index(fields=["nro_orden"]),
        ]

    def __str__(self) -> str:
        return f"Hecho {self.nro_orden}"
