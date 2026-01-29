from django.db import models
from core.models import TimeStampedModel

class System(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True, help_text="e.g., SITE-01-NVR")
    location = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Camera(TimeStampedModel):
    STATUS_CHOICES = [
        ('ONLINE', 'En Linea'),
        ('OFFLINE', 'Fuera de Linea'),
        ('MAINTENANCE', 'Mantenimiento'),
    ]

    system = models.ForeignKey(System, on_delete=models.CASCADE, related_name='cameras')
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ONLINE')
    resolution = models.CharField(max_length=20, default='1080p')

    def __str__(self):
        return f"{self.name} ({self.status})"
