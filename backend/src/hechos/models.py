from django.db import models
from core.models import TimeStampedModel
from assets.models import Camera

class Hecho(TimeStampedModel):
    CATEGORY_CHOICES = [
        ('POLICIAL', 'Policial'),
        ('OPERATIVO', 'Operativo'),
        ('INFORMATIVO', 'Informativo'),
        ('RELEVAMIENTO', 'Relevamiento'),
    ]

    timestamp = models.DateTimeField(help_text="Fecha y hora del hecho")
    description = models.TextField()
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='hechos')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OPERATIVO')
    reported_by = models.ForeignKey('personnel.Person', on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_hechos')
    
    # Operational Details
    sector = models.CharField(max_length=100, blank=True, null=True, help_text="Sector o Área donde ocurrió")
    elements = models.TextField(blank=True, null=True, help_text="Elementos involucrados")
    intervening_groups = models.CharField(max_length=200, blank=True, null=True, help_text="Grupos intervinientes (Policía, SAME, etc.)")
    
    # Resolution Status
    is_solved = models.BooleanField(default=False, verbose_name="¿Se solucionó?")
    coc_intervention = models.BooleanField(default=False, verbose_name="¿Intervención COC?")
    generated_cause = models.BooleanField(default=False, verbose_name="¿Se generó causa?")
    
    # Timing and Resolution
    end_time = models.DateTimeField(null=True, blank=True, help_text="Hora de finalización")
    resolution_time = models.CharField(max_length=100, blank=True, null=True, help_text="Tiempo de resolución (calc)")
    resolution_details = models.TextField(blank=True, null=True, help_text="Detalle de la resolución")

    # Optional external link (e.g., to a police report ID)
    external_ref = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Hecho"
        verbose_name_plural = "Hechos"

    def __str__(self):
        return f"[{self.get_category_display()}] {self.timestamp.strftime('%d/%m/%Y %H:%M')} - {self.camera.name if self.camera else 'General'}"
