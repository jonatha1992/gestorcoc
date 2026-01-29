import os
import sys

# Setup environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from rest_framework.test import APIRequestFactory
from assets.views import SystemViewSet, CameraViewSet
from novedades.views import NovedadViewSet
from personnel.views import PersonViewSet
from drf_spectacular.views import SpectacularAPIView

def test_endpoints():
    factory = APIRequestFactory()
    
    endpoints = [
        ('Systems', SystemViewSet.as_view({'get': 'list'}), '/assets/api/systems/'),
        ('Cameras', CameraViewSet.as_view({'get': 'list'}), '/assets/api/cameras/'),
        ('Novedades', NovedadViewSet.as_view({'get': 'list'}), '/novedades/api/novedades/'),
        ('Personnel', PersonViewSet.as_view({'get': 'list'}), '/personnel/api/people/'),
    ]
    
    print("\n--- API Verification Report ---")
    for name, view, url in endpoints:
        try:
            request = factory.get(url)
            response = view(request)
            status = "OK" if response.status_code == 200 else f"FAILED ({response.status_code})"
            count = len(response.data) if hasattr(response, 'data') and isinstance(response.data, list) else "N/A"
            print(f"{name:10} | Status: {status:12} | Count: {count:3} | URL: {url}")
        except Exception as e:
            print(f"{name:10} | ERROR: {str(e)}")
    
    try:
        schema_view = SpectacularAPIView.as_view()
        request = factory.get('/api/schema/')
        response = schema_view(request)
        schema_status = "OK" if response.status_code == 200 else f"FAILED ({response.status_code})"
        print(f"{'Schema':10} | Status: {schema_status:12} | URL: /api/schema/")
    except Exception as e:
        print(f"{'Schema':10} | ERROR: {str(e)}")
    print("-------------------------------\n")

if __name__ == "__main__":
    test_endpoints()
