import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from assets.models import System, Server, Camera

print(f"Systems count: {System.objects.count()}")
print(f"Servers count: {Server.objects.count()}")
print(f"Cameras count: {Camera.objects.count()}")

systems = System.objects.all()
for s in systems:
    print(f"System: {s.name}, Servers: {s.servers.count()}")
