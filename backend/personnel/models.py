from django.core.validators import RegexValidator
from django.db import models

from core.models import TimeStampedModel

LEGAJO_VALIDATOR = RegexValidator(
    regex=r"^\d{6}$",
    message="El legajo debe contener exactamente 6 digitos.",
)

DNI_VALIDATOR = RegexValidator(
    regex=r"^\d{7,10}$",
    message="El DNI debe contener solo numeros (entre 7 y 10 digitos).",
)


class Person(TimeStampedModel):
    ROLE_CHOICES = [
        ("ADMIN", "Administrador"),
        ("OP_EXTRACTION", "Operador Basico (Extraccion/Visualizacion)"),
        ("OP_CONTROL", "Operador de Camaras (Fijas/Domos/PTZ)"),
        ("OP_VIEWER", "Solo Visualizacion"),
    ]

    RANK_CHOICES = [
        ("JEFE", "Jefe"),
        ("OFICIAL_AYUDANTE_PRINCIPAL", "Oficial Ayudante Principal"),
        ("OFICIAL_PRINCIPAL", "Oficial Principal"),
        ("OFICIAL", "Oficial"),
        ("MAYOR", "Mayor"),
        ("OFICIAL_JEFE", "Oficial Jefe"),
        ("SUBINSPECTOR", "Subinspector"),
        ("INSPECTOR", "Inspector"),
        ("COMISIONADO_MAYOR", "Comisionado Mayor"),
        ("COMISIONADO_GENERAL", "Comisionado General"),
        ("CIVIL", "Civil"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    badge_number = models.CharField(
        max_length=6,
        unique=True,
        validators=[LEGAJO_VALIDATOR],
        help_text="Legajo (6 digitos)",
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="OP_VIEWER")
    rank = models.CharField(
        max_length=40,
        choices=RANK_CHOICES,
        default="CIVIL",
        help_text="Jerarquia",
    )
    unit = models.ForeignKey(
        "assets.Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="personnel",
        help_text="Unidad de revista",
    )
    guard_group = models.CharField(max_length=50, blank=True, null=True, help_text="Grupo de guardia")
    assigned_systems = models.ManyToManyField(
        "assets.System",
        blank=True,
        related_name="personnel",
        help_text="Sistemas asignados",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Persona"
        verbose_name_plural = "Personal"

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.badge_number})"


class ExternalPerson(TimeStampedModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dni = models.CharField(max_length=10, unique=True, db_index=True, validators=[DNI_VALIDATOR])
    email = models.EmailField(max_length=254)
    function = models.CharField(max_length=150, help_text="Funcion que cumple")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Personal externo"
        verbose_name_plural = "Personal externo"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.dni})"
