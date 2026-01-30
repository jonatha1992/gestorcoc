from django.db import models
from core.models import TimeStampedModel
from assets.models import Camera
from personnel.models import Person

class FilmRecord(TimeStampedModel):
    """
    Modelo completo de Registro Fílmico según estructura del Excel LIBRO DE REGISTROS FILMICOS.
    Incluye información de solicitud, causa judicial, backup y verificación CREV.
    """
    
    RECORD_TYPE_CHOICES = [
        ('VD', 'VD - Video'),
        ('IM', 'Imagen'),
        ('OT', 'Otro'),
    ]
    
    REQUEST_TYPE_CHOICES = [
        ('OFICIO', 'Oficio'),
        ('NOTA', 'Nota'),
        ('EXHORTO', 'Exhorto'),
        ('OTRO', 'Otro'),
    ]
    
    DELIVERY_STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('ENTREGADO', 'Entregado'),
        ('ANULADO', 'Anulado'),
    ]

    # ========== Información de Solicitud ==========
    issue_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Nro Asunto", help_text="Número de asunto administrativo")
    order_number = models.IntegerField(blank=True, null=True, verbose_name="Nº Orden", help_text="Número de orden secuencial")
    entry_date = models.DateField(blank=True, null=True, verbose_name="Fecha Ingreso", help_text="Fecha de ingreso de la solicitud")
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, blank=True, null=True, verbose_name="Tipo Solicitud")
    request_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Número Solicitud")
    requester = models.CharField(max_length=200, blank=True, null=True, verbose_name="Solicitante", help_text="Juzgado, Fiscalía u organismo solicitante")
    
    # ========== Información Judicial ==========
    judicial_case_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nº Causa Judicial", help_text="Número de causa o prevención sumaria", db_index=True)
    case_title = models.TextField(blank=True, null=True, verbose_name="Carátula", help_text="Carátula de la causa")
    incident_date = models.DateField(blank=True, null=True, verbose_name="Fecha del Hecho")
    crime_type = models.CharField(max_length=200, blank=True, null=True, verbose_name="Tipo de Delito")
    intervening_department = models.CharField(max_length=200, blank=True, null=True, verbose_name="Dependencia Interviniente")
    
    # ========== Referencias a Equipos y Personal ==========
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='records', verbose_name="Cámara")
    operator = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='operated_records', verbose_name="Operador")
    received_by = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='received_records', blank=True, null=True, verbose_name="Recepcionado por")
    
    # ========== Información Temporal del Registro ==========
    start_time = models.DateTimeField(verbose_name="Hora Inicio")
    end_time = models.DateTimeField(verbose_name="Hora Fin")
    record_type = models.CharField(max_length=2, choices=RECORD_TYPE_CHOICES, default='VD', verbose_name="Tipo de Registro")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    
    # ========== Gestión de Archivos y Backup ==========
    has_backup = models.BooleanField(default=False, verbose_name="¿Tiene Backup?")
    backup_path = models.CharField(max_length=500, blank=True, null=True, verbose_name="Ruta del Backup", help_text="Ubicación física o lógica del backup")
    file_hash = models.CharField(max_length=64, blank=True, null=True, verbose_name="Hash del Archivo", help_text="SHA-256 hash para verificación de integridad", db_index=True)
    file_size = models.BigIntegerField(blank=True, null=True, verbose_name="Tamaño del Archivo", help_text="Tamaño en bytes")
    
    # ========== Control de Integridad ==========
    is_integrity_verified = models.BooleanField(default=False, verbose_name="¿Integridad Verificada?", help_text="Verificación técnica automática del hash")
    
    # ========== Verificación CREV (Control de Calidad) ==========
    verified_by_crev = models.ForeignKey(
        Person, 
        on_delete=models.PROTECT, 
        related_name='verified_records', 
        blank=True, 
        null=True, 
        verbose_name="Verificado por CREV",
        help_text="Fiscalizador CREV que certificó el registro"
    )
    verification_date = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Verificación CREV")
    is_editable = models.BooleanField(default=True, verbose_name="¿Es Editable?", help_text="False si ya fue verificado por CREV")
    
    # ========== Estado y Entrega ==========
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS_CHOICES, default='PENDIENTE', verbose_name="Estado de Entrega")
    observations = models.TextField(blank=True, null=True, verbose_name="Observaciones")

    class Meta:
        verbose_name = "Registro Fílmico"
        verbose_name_plural = "Registros Fílmicos"
        ordering = ['-entry_date', '-created_at']
        indexes = [
            models.Index(fields=['judicial_case_number']),
            models.Index(fields=['issue_number']),
            models.Index(fields=['entry_date']),
            models.Index(fields=['delivery_status']),
            models.Index(fields=['file_hash']),
        ]

    def __str__(self):
        if self.judicial_case_number:
            return f"Registro #{self.id} - Causa {self.judicial_case_number}"
        return f"Registro #{self.id} - {self.camera} - {self.start_time}"
    
    def save(self, *args, **kwargs):
        """
        Validación automática: Si un registro es verificado por CREV, 
        automáticamente se marca como no editable.
        """
        if self.verified_by_crev and self.verification_date:
            self.is_editable = False
        super().save(*args, **kwargs)

class Catalog(TimeStampedModel):
    name = models.CharField(max_length=100)
    records = models.ManyToManyField(FilmRecord, related_name='catalogs')

    def __str__(self):
        return self.name
