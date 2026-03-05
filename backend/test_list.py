import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novedades.models import Novedad
from novedades.serializers import NovedadSerializer
from rest_framework.request import Request
from django.test import RequestFactory

qs = Novedad.objects.all()[:2]
serializer = NovedadSerializer(qs, many=True)

with open('output_list.json', 'w', encoding='utf-8') as f:
    json.dump(serializer.data, f, indent=4)
