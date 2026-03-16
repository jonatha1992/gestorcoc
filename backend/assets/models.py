from django.db import models
from core.models import TimeStampedModel

class Unit(TimeStampedModel):
    name = models.CharField(max_length=100, db_index=True)
    code = models.CharField(max_length=10, unique=True, db_index=True, help_text="e.g., AEP, EZE")
    airport = models.CharField(max_length=100, blank=True, null=True, help_text="Aeropuerto")
    province = models.CharField(max_length=100, blank=True, null=True, help_text="Provincia")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Latitud")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Longitud")
    map_enabled = models.BooleanField(default=False, db_index=True, help_text="Mostrar en mapa operacional")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_units', help_text="Entidad Superior (e.g., CREV)")

    def __str__(self):
        return f"{self.name} ({self.code})"

class System(TimeStampedModel):
    SYSTEM_TYPE_CHOICES = [
        ('NVR', 'NVR (Grabador)'),
        ('CCTV', 'Sistema CCTV Completo'),
    ]

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='systems', null=True, blank=True)
    name = models.CharField(max_length=100, unique=True, db_index=True, help_text="e.g., SITE-01-NVR")
    system_type = models.CharField(max_length=10, choices=SYSTEM_TYPE_CHOICES, default='CCTV')
    is_active = models.BooleanField(default=True)
    retention_days = models.PositiveIntegerField(default=30, help_text="Cantidad de tiempo de resguardo (dias)")
    vms_version = models.CharField(max_length=50, blank=True, default='', help_text="Version del software VMS")

    def __str__(self):
        return f"{self.name} ({self.get_system_type_display()}) - {self.unit.code if self.unit else 'No Unit'}"

class Server(TimeStampedModel):
    system = models.ForeignKey(System, on_delete=models.CASCADE, related_name='servers')
    name = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.system.name}"

class Camera(TimeStampedModel):
    STATUS_CHOICES = [
        ('ONLINE', 'En Linea'),
        ('OFFLINE', 'Fuera de Linea'),
        ('MAINTENANCE', 'Mantenimiento'),
    ]

    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='cameras', null=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ONLINE', db_index=True)
    resolution = models.CharField(max_length=20, default='1080p')
    photo_data = models.TextField(
        blank=True,
        default='',
        help_text='Imagen de referencia pequena en formato data URL base64.',
    )

    def __str__(self):
        return f"{self.name} ({self.status})"

class CameramanGear(TimeStampedModel):
    CONDITION_CHOICES = [
        ('GOOD', 'Bueno'),
        ('FAIR', 'Regular'),
        ('BROKEN', 'Roto'),
    ]

    name = models.CharField(max_length=100, db_index=True, help_text="e.g., Chaleco, Radio, Batería")
    serial_number = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    assigned_to = models.ForeignKey(
        'personnel.Person', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_gear'
    )
    assigned_to_name = models.CharField(max_length=100, blank=True, help_text="Nombre libre (legado)")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.serial_number or 'S/N'}"
