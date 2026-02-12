from django.db import models
from core.models import TimeStampedModel

class Person(TimeStampedModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    badge_number = models.CharField(max_length=20, unique=True, help_text="Legajo")
    role = models.CharField(max_length=50, default='OPERATOR')
<<<<<<< HEAD
=======
    rank = models.CharField(max_length=100, blank=True, null=True, help_text="Jerarquía")
    unit = models.ForeignKey('assets.Unit', on_delete=models.SET_NULL, null=True, blank=True, related_name='personnel', help_text="Unidad de Revista")
    guard_group = models.CharField(max_length=50, blank=True, null=True, help_text="Grupo de Guardia")
    assigned_systems = models.ManyToManyField('assets.System', blank=True, related_name='personnel', help_text="Sistemas asignados")
>>>>>>> dev
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.badge_number})"
