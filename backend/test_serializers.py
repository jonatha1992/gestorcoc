import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novedades.models import Novedad
from novedades.serializers import NovedadSerializer

n = Novedad.objects.first()
serializer = NovedadSerializer(n)

with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(serializer.data, f, indent=4)
