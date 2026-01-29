import os
import django
import sys

# Add the src directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assets.models import System, Camera
from novedades.models import Novedad
from personnel.models import Person

def seed():
    print("Seeding database...")
    
    # Personnel
    p1, _ = Person.objects.get_or_create(first_name="Admin", last_name="User", badge_number="0001", role="ADMIN")
    p2, _ = Person.objects.get_or_create(first_name="Operator", last_name="One", badge_number="0002", role="OPERATOR")
    
    # Assets
    s1, _ = System.objects.get_or_create(name="NVR-01", ip_address="192.168.1.100", location="Room 101")
    c1, _ = Camera.objects.get_or_create(system=s1, name="CAM-01", ip_address="192.168.1.101", status="ONLINE")
    c2, _ = Camera.objects.get_or_create(system=s1, name="CAM-02", ip_address="192.168.1.102", status="OFFLINE")
    
    # Novedades
    Novedad.objects.get_or_create(
        camera=c2, 
        description="Camera offline since morning", 
        incident_type="CONNECTION_LOST", 
        severity="HIGH", 
        reported_by="Admin User"
    )
    
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
