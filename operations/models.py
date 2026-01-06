from django.conf import settings
from django.db import models

from core.models import CctvSystem, OrganizationalGroup, OrganizationalUnit
from inventory.models import Camera


class Detector(models.TextChoices):
    GUARDIA = "Guardia de Prevencion", "Guardia de Prevencion"
    MONITOREO = "Centro Monitoreo", "Centro Monitoreo"


class HechoStatus(models.TextChoices):
    ABIERTO = "Abierto", "Abierto"
    CERRADO = "Cerrado", "Cerrado"


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
    status = models.CharField(
        max_length=20,
        choices=HechoStatus.choices,
        default=HechoStatus.ABIERTO,
        db_index=True,
        blank=True,
    )
    cctv_system = models.ForeignKey(
        CctvSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos",
    )
    camera = models.ForeignKey(
        Camera,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos",
    )
    resolved_group = models.ForeignKey(
        OrganizationalGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos_resueltos",
    )
    org_unit = models.ForeignKey(
        OrganizationalUnit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hechos_resueltos",
    )
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
            models.Index(fields=["status"]),
            models.Index(fields=["org_unit"]),
        ]

    def __str__(self) -> str:
        return f"Hecho {self.nro_orden}"

    @property
    def minutos_resolucion(self) -> int | None:
        """Retorna minutos desde la intervención hasta el cierre, si existe."""
        if self.resolved_at and self.fecha_intervencion:
            delta = self.resolved_at - self.fecha_intervencion
            return int(delta.total_seconds() // 60)
        return None

    @property
    def tiempo_resolucion_legible(self) -> str | None:
        minutos = self.minutos_resolucion
        if minutos is None:
            return None
        horas, mins = divmod(minutos, 60)
        if horas:
            return f"{horas}h {mins}m"
        return f"{mins}m"
