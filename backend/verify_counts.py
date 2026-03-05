import os, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assets.models import System, Server, Camera, CameramanGear, Unit
from novedades.models import Novedad
from personnel.models import Person
from records.models import FilmRecord, Catalog

counts = {
    'Units': Unit.objects.count(),
    'Systems': System.objects.count(),
    'Servers': Server.objects.count(),
    'Cameras': Camera.objects.count(),
    'CameramanGear': CameramanGear.objects.count(),
    'Personnel': Person.objects.count(),
    'FilmRecords': FilmRecord.objects.count(),
    'Catalogs': Catalog.objects.count(),
    'Novedades': Novedad.objects.count(),
}

for k, v in counts.items():
    print(f"  {k}: {v}")
