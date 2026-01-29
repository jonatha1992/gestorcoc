from django.db import models
from core.models import TimeStampedModel

class Person(TimeStampedModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    badge_number = models.CharField(max_length=20, unique=True, help_text="Legajo")
    role = models.CharField(max_length=50, default='OPERATOR')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.badge_number})"
