from django.conf import settings
from django.db import models

from core.models import CatalogItem, CctvSystem, OrganizationalUnit


class DocumentType(models.TextChoices):
    ENTRADA = "ENTRADA", "ENTRADA"
    SALIDA = "SALIDA", "SALIDA"


class DocumentStatus(models.TextChoices):
    PENDIENTE = "PENDIENTE", "PENDIENTE"
    EN_PROCESO = "EN_PROCESO", "EN_PROCESO"
    ARCHIVADO = "ARCHIVADO", "ARCHIVADO"
    FINALIZADO = "FINALIZADO", "FINALIZADO"


class DocumentPriority(models.TextChoices):
    BAJA = "BAJA", "BAJA"
    MEDIA = "MEDIA", "MEDIA"
    ALTA = "ALTA", "ALTA"


class Document(models.Model):
    doc_type = models.CharField(max_length=20, choices=DocumentType.choices, default=DocumentType.ENTRADA, db_index=True)
    date = models.DateField()
    reference_number = models.CharField(max_length=120, unique=True, db_index=True)
    sender = models.CharField(max_length=150)
    recipient = models.CharField(max_length=150)
    subject = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=DocumentStatus.choices, default=DocumentStatus.PENDIENTE, db_index=True)
    priority = models.CharField(max_length=20, choices=DocumentPriority.choices, default=DocumentPriority.MEDIA)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["reference_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["priority"]),
        ]

    def __str__(self) -> str:
        return f"{self.reference_number}"


class DocumentAttachment(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="docs/%Y/%m/")
    original_name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.original_name


class FilmRecordStatus(models.TextChoices):
    PENDIENTE = "Pendiente", "Pendiente"
    EN_PROCESO = "En Proceso", "En Proceso"
    FINALIZADO = "Finalizado", "Finalizado"


class FilmRecord(models.Model):
    nro_asunto = models.CharField(max_length=120)
    nro_orden = models.CharField(max_length=120, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    tipo_solicitud = models.ForeignKey(
        CatalogItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_record_request_types",
    )
    nro_solicitud = models.CharField(max_length=120, blank=True)
    solicitante = models.CharField(max_length=150, blank=True)
    causa_judicial = models.CharField(max_length=200, blank=True)
    caratula = models.CharField(max_length=200, blank=True)
    fecha_hecho = models.DateField(null=True, blank=True)
    tipo_delito = models.ForeignKey(
        CatalogItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_record_crime_types",
    )
    unidad = models.ForeignKey(
        CatalogItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_record_units",
    )
    recepcionado_por = models.CharField(max_length=150, blank=True)
    confeccionado_por = models.CharField(max_length=150, blank=True)
    detalle = models.TextField(blank=True)
    nro_dvd = models.CharField(max_length=120, blank=True)
    nro_informe = models.CharField(max_length=120, blank=True)
    ifgra = models.CharField(max_length=120, blank=True)
    nro_expediente = models.CharField(max_length=120, blank=True)
    acta_entrega = models.CharField(max_length=120, blank=True)
    fecha_salida = models.DateField(null=True, blank=True)
    retirado_por = models.CharField(max_length=150, blank=True)
    organismo = models.ForeignKey(
        CatalogItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_record_organizations",
    )
    estado = models.CharField(max_length=20, choices=FilmRecordStatus.choices, default=FilmRecordStatus.PENDIENTE, db_index=True)
    observaciones = models.TextField(blank=True)
    org_unit = models.ForeignKey(
        OrganizationalUnit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_records",
    )
    org_system = models.ForeignKey(
        CctvSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_records",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="film_records_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["fecha_ingreso"]),
        ]

    def __str__(self) -> str:
        return self.nro_asunto
