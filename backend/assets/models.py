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
    REPORT_AUTHENTICITY_MODE_CHOICES = [
        ('vms_propio', 'Autenticacion provista por el propio sistema'),
        ('hash_preventivo', 'Hash preventivo externo'),
        ('sin_autenticacion', 'Sin autenticacion'),
        ('otro', 'Otro metodo'),
    ]

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='systems', null=True, blank=True)
    name = models.CharField(max_length=100, unique=True, db_index=True, help_text="e.g., SITE-01-NVR")
    system_type = models.CharField(max_length=10, choices=SYSTEM_TYPE_CHOICES, default='CCTV')
    is_active = models.BooleanField(default=True)
    report_authenticity_mode_default = models.CharField(
        max_length=20,
        choices=REPORT_AUTHENTICITY_MODE_CHOICES,
        blank=True,
        default='',
        help_text="Metodo sugerido para la autenticidad del material en informes.",
    )
    report_authenticity_detail_default = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text="Detalle sugerido cuando la autenticidad del material es 'otro'.",
    )
    report_native_hash_algorithms_default = models.JSONField(
        default=list,
        blank=True,
        help_text="Algoritmos hash nativos sugeridos para el informe.",
    )
    report_native_hash_algorithm_other_default = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text="Texto libre para algoritmos nativos no contemplados en la lista.",
    )
    report_hash_program_default = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text="Programa de hash sugerido cuando aplica verificacion externa.",
    )

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

    def __str__(self):
        return f"{self.name} ({self.status})"

class CameramanGear(TimeStampedModel):
    CONDITION_CHOICES = [
        ('NEW', 'Nuevo'),
        ('GOOD', 'Bueno'),
        ('FAIR', 'Regular'),
        ('POOR', 'Malo'),
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
