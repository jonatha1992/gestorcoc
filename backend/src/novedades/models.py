from django.db import models
from core.models import TimeStampedModel
from assets.models import Camera

class Novedad(TimeStampedModel):
    SEVERITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Critica'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Abierta'),
        ('IN_PROGRESS', 'En Progreso'),
        ('CLOSED', 'Cerrada'),
    ]

    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='novedades')
    description = models.TextField()
    incident_type = models.CharField(max_length=50, default='FALLA_TECNICA')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    reported_by = models.CharField(max_length=100, help_text="User who reported")
    external_ticket_id = models.CharField(max_length=50, blank=True, null=True, help_text="Ticket DGT/CCO")

    def __str__(self):
        return f"[{self.status}] {self.camera} - {self.incident_type}"
