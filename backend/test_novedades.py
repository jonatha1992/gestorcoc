import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novedades.models import Novedad
print("Total Novedades:", Novedad.objects.count())
for n in Novedad.objects.all():
    print(n.id, n.description, n.camera, n.server, n.system, n.cameraman_gear)
