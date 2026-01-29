from django.db import models
from core.models import TimeStampedModel
from assets.models import Camera
from personnel.models import Person

class FilmRecord(TimeStampedModel):
    RECORD_TYPE_CHOICES = [
        ('VD', 'VD - Video'),
        ('IM', 'Imagen'),
        ('OT', 'Otro'),
    ]

    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='records')
    operator = models.ForeignKey(Person, on_delete=models.PROTECT, related_name='records')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    description = models.TextField()
    record_type = models.CharField(max_length=2, choices=RECORD_TYPE_CHOICES, default='VD')
    
    # Integredad / Verification
    is_verified = models.BooleanField(default=False)
    verification_hash = models.CharField(max_length=64, blank=True, null=True, help_text="SHA-256 integrity hash")

    def __str__(self):
        return f"Record {self.id} - {self.camera} - {self.start_time}"

class Catalog(TimeStampedModel):
    name = models.CharField(max_length=100)
    records = models.ManyToManyField(FilmRecord, related_name='catalogs')

    def __str__(self):
        return self.name
