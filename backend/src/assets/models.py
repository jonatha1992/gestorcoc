from django.db import models
from core.models import TimeStampedModel

<<<<<<< HEAD
class System(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True, help_text="e.g., SITE-01-NVR")
    location = models.CharField(max_length=255, blank=True)
=======
class Unit(TimeStampedModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True, help_text="e.g., AEP, EZE")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_units', help_text="Entidad Superior (e.g., CREV)")
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class System(TimeStampedModel):
    SYSTEM_TYPE_CHOICES = [
        ('NVR', 'NVR (Grabador)'),
        ('CCTV', 'Sistema CCTV Completo'),
    ]
    
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='systems', null=True, blank=True)
    name = models.CharField(max_length=100, unique=True, help_text="e.g., SITE-01-NVR")
    system_type = models.CharField(max_length=10, choices=SYSTEM_TYPE_CHOICES, default='CCTV')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_system_type_display()}) - {self.unit.code if self.unit else 'No Unit'}"

class Server(TimeStampedModel):
    system = models.ForeignKey(System, on_delete=models.CASCADE, related_name='servers')
    name = models.CharField(max_length=100)
>>>>>>> dev
    ip_address = models.GenericIPAddressField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
<<<<<<< HEAD
        return self.name
=======
        return f"{self.name} - {self.system.name}"
>>>>>>> dev

class Camera(TimeStampedModel):
    STATUS_CHOICES = [
        ('ONLINE', 'En Linea'),
        ('OFFLINE', 'Fuera de Linea'),
        ('MAINTENANCE', 'Mantenimiento'),
    ]

<<<<<<< HEAD
    system = models.ForeignKey(System, on_delete=models.CASCADE, related_name='cameras')
=======
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='cameras', null=True, blank=True)
    # Temporary system field for migration or dual access if needed, but primary link is server.
    # Actually, let's just use server as the primary link.
>>>>>>> dev
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ONLINE')
    resolution = models.CharField(max_length=20, default='1080p')

    def __str__(self):
        return f"{self.name} ({self.status})"
<<<<<<< HEAD
=======

class CameramanGear(TimeStampedModel):
    CONDITION_CHOICES = [
        ('NEW', 'Nuevo'),
        ('GOOD', 'Bueno'),
        ('FAIR', 'Regular'),
        ('POOR', 'Malo'),
        ('BROKEN', 'Roto'),
    ]

    name = models.CharField(max_length=100, help_text="e.g., Chaleco, Radio, Batería")
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    assigned_to = models.CharField(max_length=100, blank=True, null=True, help_text="Nombre del camarógrafo responsable")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.serial_number or 'S/N'}"
>>>>>>> dev
