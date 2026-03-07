from django.db import models
from core.models import TimeStampedModel
from personnel.models import Person

class FilmRecord(TimeStampedModel):
    """
    Registro Fílmico — fiel al LIBRO DE REGISTROS FILMICOS (Excel).
    Cubre todos los campos que el operador llena en el libro real.
    """

    REQUEST_TYPE_CHOICES = [
        ('FORMULARIO', 'Formulario'),
        ('MEMORANDO', 'Memorando'),
        ('NOTA', 'Nota'),
        ('OFICIO', 'Oficio'),
        ('EXHORTO', 'Exhorto'),
        ('OTRO', 'Otro'),
    ]

    DELIVERY_STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('ENTREGADO', 'Entregado'),
        ('DERIVADO', 'Derivado'),
        ('FINALIZADO', 'Finalizado'),
        ('ANULADO', 'Anulado'),
    ]

    # ========== Información de Solicitud (cols A-F del Excel) ==========
    issue_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Nro Asunto")
    order_number = models.IntegerField(blank=True, null=True, verbose_name="Nº Orden")
    entry_date = models.DateField(blank=True, null=True, verbose_name="Fecha Ingreso")
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, blank=True, null=True, verbose_name="Tipo Solicitud")
    request_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Número Solicitud")
    requester = models.CharField(max_length=200, blank=True, null=True, verbose_name="Solicitante")

    # ========== Información Judicial (cols G-K del Excel) ==========
    judicial_case_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nº Causa Judicial / Prevención Sumaria", db_index=True)
    case_title = models.TextField(blank=True, null=True, verbose_name="Carátula")
    incident_date = models.DateField(blank=True, null=True, verbose_name="Fecha del Hecho")
    crime_type = models.CharField(max_length=200, blank=True, null=True, verbose_name="Tipo de Delito")
    intervening_department = models.CharField(max_length=200, blank=True, null=True, verbose_name="Dependencia Interviniente")

    # ========== Sistema CCTV / VMS (fuente del material) ==========
    sistema = models.CharField(max_length=200, blank=True, null=True, verbose_name="Sistema CCTV / VMS", help_text="Sistema o dispositivo del que proviene el material (ej: MILESTONE, VIPRO, DAHUA, NVR HIKVISION)")

    # ========== Personal (cols L-M del Excel) ==========
    received_by = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='received_records', blank=True, null=True, verbose_name="Recepcionado por")
    operator = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='operated_records', blank=True, null=True, verbose_name="Confeccionado por")

    # ========== Detalle y soporte físico (cols N-R del Excel) ==========
    description = models.TextField(blank=True, null=True, verbose_name="Detalle")
    dvd_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nº de DVD")
    report_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nº de Informe")
    ifgra_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="IFGRA")
    expediente_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Expediente")

    # ========== Entrega (cols S-V del Excel) ==========
    delivery_act_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nº Acta Entrega / Elevación")
    delivery_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Salida")
    retrieved_by = models.CharField(max_length=200, blank=True, null=True, verbose_name="Retirado por")
    organism = models.CharField(max_length=200, blank=True, null=True, verbose_name="Organismo")

    # ========== Estado y observaciones (cols W-X del Excel) ==========
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS_CHOICES, default='PENDIENTE', verbose_name="Estado")
    observations = models.TextField(blank=True, null=True, verbose_name="Observaciones")

    # ========== Integridad y backup ==========
    has_backup = models.BooleanField(default=False, verbose_name="¿Tiene Backup?")
    backup_path = models.CharField(max_length=500, blank=True, null=True, verbose_name="Ruta del Backup")
    file_hash = models.CharField(max_length=128, blank=True, null=True, verbose_name="Hash del Archivo", db_index=True)
    hash_algorithm = models.CharField(
        max_length=10, blank=True, null=True,
        choices=[('sha256', 'SHA-256'), ('sha512', 'SHA-512'), ('sha3', 'SHA-3'), ('sha1', 'SHA-1')],
        verbose_name="Algoritmo de Hash",
    )
    file_size = models.BigIntegerField(blank=True, null=True, verbose_name="Tamaño del Archivo (bytes)")
    is_integrity_verified = models.BooleanField(default=False, verbose_name="¿Integridad Verificada?")

    # ========== Verificación CREV ==========
    verified_by_crev = models.ForeignKey(
        Person,
        on_delete=models.PROTECT,
        related_name='verified_records',
        blank=True,
        null=True,
        verbose_name="Verificado por CREV",
    )
    verification_date = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Verificación CREV")
    is_editable = models.BooleanField(default=True, verbose_name="¿Es Editable?")

    # ========== Referencia temporal (opcional) ==========
    start_time = models.DateTimeField(blank=True, null=True, verbose_name="Hora Inicio")
    end_time = models.DateTimeField(blank=True, null=True, verbose_name="Hora Fin")
    
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
        if self.order_number:
            return f"Registro {self.order_number} — {self.judicial_case_number or 'S/N'}"
        return f"Registro #{self.id}"

    def save(self, *args, **kwargs):
        if self.verified_by_crev and self.verification_date:
            self.is_editable = False
        super().save(*args, **kwargs)

class Catalog(TimeStampedModel):
    name = models.CharField(max_length=100, db_index=True)
    records = models.ManyToManyField(FilmRecord, related_name='catalogs')

    def __str__(self):
        return self.name


class VideoAnalysisReport(TimeStampedModel):
    """Persiste los datos del wizard de informes. Puede estar vinculado a un FilmRecord o ser independiente."""
    film_record = models.OneToOneField(
        FilmRecord, on_delete=models.SET_NULL,
        related_name='informe', null=True, blank=True
    )
    numero_informe = models.CharField(max_length=100, blank=True)
    report_date = models.DateField(null=True, blank=True)
    form_data = models.JSONField(default=dict)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Informe {self.numero_informe or self.id}"


class AIUsageLog(TimeStampedModel):
    PROVIDER_CHOICES = [
        ('gemini', 'Gemini'),
        ('openrouter', 'OpenRouter'),
        ('groq', 'Groq'),
        ('ollama', 'Ollama'),
    ]
    ENDPOINT_CHOICES = [
        ('improve_text', 'Mejora de texto'),
        ('video_report', 'Generación de informe'),
    ]

    provider     = models.CharField(max_length=30, choices=PROVIDER_CHOICES)
    model_name   = models.CharField(max_length=100)
    endpoint     = models.CharField(max_length=30, choices=ENDPOINT_CHOICES, default='improve_text')
    tokens_in    = models.PositiveIntegerField(default=0)
    tokens_out   = models.PositiveIntegerField(default=0)
    tokens_total = models.PositiveIntegerField(default=0)
    success      = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Registro de uso de IA'
        verbose_name_plural = 'Registros de uso de IA'

    def __str__(self):
        return f"[{self.provider}] {self.created_at:%d/%m/%Y} — {self.tokens_total} tokens"
