import os
import django
import sys
import random
from datetime import timedelta
from django.utils import timezone
from faker import Faker

# Add the src directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from assets.models import System, Server, Camera, Unit
from novedades.models import Novedad
from personnel.models import Person
from records.models import FilmRecord, Catalog

fake = Faker(['es_ES'])

def seed():
    print("Clearing existing data...")
    Catalog.objects.all().delete()
    FilmRecord.objects.all().delete()
    Novedad.objects.all().delete()
    Camera.objects.all().delete()
    Server.objects.all().delete()
    System.objects.all().delete()
    Person.objects.all().delete()
    User.objects.exclude(username='admin').delete()
    Unit.objects.all().delete()
    
    print("Seeding database with mock data...")
    
    # --- 0.1 Units ---
    print("Creating Units...")
    unit_eze, _ = Unit.objects.get_or_create(name='COC Ezeiza', defaults={'code': 'EZE'})
    unit_aep, _ = Unit.objects.get_or_create(name='COC Aeroparque', defaults={'code': 'AEP'})
    unit_crep, _ = Unit.objects.get_or_create(name='CREP Central', defaults={'code': 'CREP'})
    unit_cor, _ = Unit.objects.get_or_create(name='COC Córdoba', defaults={'code': 'COR'})
    
    units = [unit_eze, unit_aep, unit_crep, unit_cor]
    
    # --- 0. Admin and Specific Users ---
    print("Creating Specific Users...")
    
    # Ensure superuser exists
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Created superuser: admin/admin123")

    specific_users = [
        {'username': 'coc_operador_1', 'role': 'OPERATOR', 'rank': 'Oficial Primero', 'unit': unit_eze},
        {'username': 'coc_operador_2', 'role': 'OPERATOR', 'rank': 'Oficial de Guardia', 'unit': unit_aep},
        {'username': 'crep_fiscalizador', 'role': 'SUPERVISOR', 'rank': 'Comisionado', 'unit': unit_crep},
    ]

    for u_info in specific_users:
        user, created = User.objects.get_or_create(
            username=u_info['username'],
            defaults={'email': f"{u_info['username']}@example.com"}
        )
        if created:
            user.set_password('pass123')
            user.save()
            print(f"Created user: {u_info['username']}/pass123")
        
        Person.objects.get_or_create(
            badge_number=fake.unique.numerify(text='5###'),
            defaults={
                'first_name': u_info['username'].replace('_', ' ').title(),
                'last_name': 'Gestor',
                'role': u_info['role'],
                'rank': u_info['rank'],
                'unit': u_info['unit'],
                'is_active': True
            }
        )

    # --- 1. Personnel ---
    print("Creating additional Personnel...")
    roles = ['OPERATOR', 'SUPERVISOR', 'ADMIN', 'TECHNICAL']
    people = list(Person.objects.all())
    for _ in range(10):
        p, created = Person.objects.get_or_create(
            badge_number=fake.unique.numerify(text='4###'),
            defaults={
                'first_name': fake.first_name(),
                'last_name': fake.last_name(),
                'role': random.choice(roles),
                'rank': random.choice(['Oficial', 'Suboficial', 'Cabo']),
                'unit': random.choice(units)
            }
        )
        people.append(p)
    
    # --- 2. Assets ---
    print("Creating Systems, Servers and Cameras...")
    
    
    # Topology definition
    locations = [unit_eze, unit_aep]
    topology_map = {
        'EZE': ['Avigilon'],
        'AEP': ['Milestone']
    }
    
    systems_list = []

    for unit_obj in locations:
        if unit_obj.code in topology_map:
            allowed_systems = topology_map[unit_obj.code]
            for sys_type in allowed_systems:
                # Create System
                s_name = f"{sys_type} {unit_obj.code}"
                s, _ = System.objects.get_or_create(
                    name=s_name,
                    defaults={
                        'system_type': 'CCTV',
                        'unit': unit_obj,
                        'is_active': True
                    }
                )
                systems_list.append(s)
                
                # Create 8 Servers per System
                for i in range(8):
                    srv_name = f"SRV-{unit_obj.code}-{sys_type[:3].upper()}-{i+1:02d}"
                    srv, _ = Server.objects.get_or_create(
                        name=srv_name,
                        system=s,
                        defaults={
                            # Unique IP generation logic
                            'ip_address': f"10.{100 + locations.index(unit_obj)}.{systems_list.index(s) + 10}.{i+1}",
                            'is_active': True
                        }
                    )

                    # Create 20 Cameras per Server
                    for j in range(20):
                        cam_name = f"CAM-{srv_name}-{j+1:02d}"
                        Camera.objects.get_or_create(
                            name=cam_name,
                            server=srv,
                            defaults={
                                'ip_address': f"{srv.ip_address}.{j+50}",
                                'status': random.choice(['ONLINE', 'ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']),
                                'resolution': random.choice(['1080p', '4MP', '5MP', '4K'])
                            }
                        )
            
    all_cameras = list(Camera.objects.all())
    
    # --- 3. Records ---
    print("Creating Film Records...")
    records = []
    for _ in range(30):
        camera = random.choice(all_cameras)
        operator = random.choice(people)
        
        start = fake.date_time_between(start_date='-30d', end_date='now', tzinfo=timezone.get_current_timezone())
        duration = random.randint(15, 180) # minutes
        end = start + timedelta(minutes=duration)
        
        r = FilmRecord.objects.create(
            camera=camera,
            operator=operator,
            start_time=start,
            end_time=end,
            description=f"Oficio Judicial Nro {fake.numerify(text='####/2026')} - Requerimiento de Evidencia",
            record_type=random.choice(['VD', 'VD', 'IM']),
            is_integrity_verified=random.choice([True, False]),
            file_hash=fake.sha256() if random.random() > 0.4 else None
        )
        records.append(r)
        
    print("Creating Catalogs...")
    for cat_name in ['Fiscalía Federal 1', 'Juzgado de Garantías', 'Auditoría Interna CREV']:
        cat = Catalog.objects.create(name=cat_name)
        selected_records = random.sample(records, k=random.randint(3, 8))
        cat.records.add(*selected_records)

    # --- 4. Novedades ---
    print("Creating Novedades...")
    incident_types = ['FALLA_TECNICA', 'DESCONEXION', 'OBJETO_SOSPECHOSO', 'DISTURBIO', 'SOPORTE']
    for _ in range(15):
        camera = random.choice(all_cameras)
        Novedad.objects.create(
            camera=camera,
            description=fake.paragraph(nb_sentences=2),
            incident_type=random.choice(incident_types),
            severity=random.choice(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            status=random.choice(['OPEN', 'IN_PROGRESS', 'CLOSED']),
            reported_by=random.choice(people).first_name,
            external_ticket_id=fake.bothify(text='DGT-#####') if random.random() > 0.5 else None
        )
    
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
