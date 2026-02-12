from django.db import models
from core.models import TimeStampedModel
<<<<<<< HEAD
from assets.models import Camera
=======
from assets.models import Camera, System, Server, CameramanGear
>>>>>>> dev

class Novedad(TimeStampedModel):
    SEVERITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
<<<<<<< HEAD
        ('CRITICAL', 'Critica'),
    ]
=======
        ('CRITICAL', 'Crítica'),
    ]

>>>>>>> dev
    STATUS_CHOICES = [
        ('OPEN', 'Abierta'),
        ('IN_PROGRESS', 'En Progreso'),
        ('CLOSED', 'Cerrada'),
    ]

<<<<<<< HEAD
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='novedades')
    description = models.TextField()
    incident_type = models.CharField(max_length=50, default='FALLA_TECNICA')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    reported_by = models.CharField(max_length=100, help_text="User who reported")
    external_ticket_id = models.CharField(max_length=50, blank=True, null=True, help_text="Ticket DGT/CCO")

    def __str__(self):
        return f"[{self.status}] {self.camera} - {self.incident_type}"
=======
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
>>>>>>> dev
