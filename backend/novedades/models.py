from django.db import models
from core.models import TimeStampedModel
from assets.models import Camera, System, Server, CameramanGear

class Novedad(TimeStampedModel):
    SEVERITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Crítica'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Abierta'),
        ('IN_PROGRESS', 'En Progreso'),
        ('CLOSED', 'Cerrada'),
    ]

    # Asset Link (Polymorphic-ish via nullable FKs is simplest for now)
    camera = models.ForeignKey(Camera, on_delete=models.SET_NULL, null=True, blank=True, related_name='novedades')
    system = models.ForeignKey(System, on_delete=models.SET_NULL, null=True, blank=True, related_name='novedades')
    server = models.ForeignKey(Server, on_delete=models.SET_NULL, null=True, blank=True, related_name='novedades')
    cameraman_gear = models.ForeignKey(CameramanGear, on_delete=models.SET_NULL, null=True, blank=True, related_name='novedades')

    description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    incident_type = models.CharField(max_length=50, blank=True) # e.g., 'CONECTIVIDAD', 'DAÑO_FISICO', 'EVENTO'
    
    reported_by = models.CharField(max_length=100) # User name or ID
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    external_ticket_id = models.CharField(max_length=50, blank=True, null=True, help_text="ID del ticket en DGT/CCO")

    def __str__(self):
        target = self.camera or self.server or self.system or self.cameraman_gear or "General"
        return f"[{self.severity}] {self.incident_type} - {target}"
