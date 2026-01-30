import os
import django
import sys
import json

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assets.models import System
from assets.serializers import SystemSerializer

systems = System.objects.all()
serializer = SystemSerializer(systems, many=True)
data = serializer.data

# Print first system's structure keys and nested counts
if len(data) > 0:
    s = data[0]
    print(f"System: {s.get('name')}")
    print(f"Keys: {list(s.keys())}")
    if 'servers' in s:
        print(f"Servers count in JSON: {len(s['servers'])}")
        if len(s['servers']) > 0:
            srv = s['servers'][0]
            print(f"Server Keys: {list(srv.keys())}")
            if 'cameras' in srv:
                 print(f"Cameras count in Server 0: {len(srv['cameras'])}")
    else:
        print("KEY 'servers' MISSING in SystemSerializer output!")
else:
    print("No systems found in serializer output.")
