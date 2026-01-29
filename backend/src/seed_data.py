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
from assets.models import System, Camera
from novedades.models import Novedad
from personnel.models import Person
from records.models import FilmRecord, Catalog

fake = Faker(['es_ES'])

def seed():
    print("Seeding database with mock data...")
    
    # --- 0. Admin and Specific Users ---
    print("Creating Specific Users...")
    
    # Ensure superuser exists
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Created superuser: admin/admin123")

    specific_users = [
        {'username': 'coc_operador_1', 'role': 'OPERATOR', 'rank': 'Oficial Primero', 'unit': 'COC Ezeiza'},
        {'username': 'coc_operador_2', 'role': 'OPERATOR', 'rank': 'Oficial de Guardia', 'unit': 'COC Aeroparque'},
        {'username': 'crep_fiscalizador', 'role': 'SUPERVISOR', 'rank': 'Comisionado', 'unit': 'CREP Central'},
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
                'unit': random.choice(['COC Ezeiza', 'COC Aeroparque', 'COC Cordoba'])
            }
        )
        people.append(p)
    
    # --- 2. Assets ---
    print("Creating Systems and Cameras...")
    locations = ['EZE-T1', 'EZE-T2', 'EZE-PK', 'AEP-T1', 'AEP-T2']
    systems = []
    for i in range(5):
        s, created = System.objects.get_or_create(
            name=f"VMS-{locations[i % len(locations)]}-{i+1:02d}",
            defaults={
                'location': locations[i % len(locations)],
                'ip_address': f"10.116.80.{100 + i}",
                'is_active': True
            }
        )
        systems.append(s)
        
        # Add cameras to each system
        for j in range(8):
            Camera.objects.get_or_create(
                name=f"CAM-{s.name}-L{j+1:02d}",
                system=s,
                defaults={
                    'ip_address': f"10.116.80.{100 + i}.{j+10}",
                    'status': random.choice(['ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']),
                    'resolution': random.choice(['1080p', '4MP', '5MP', '12MP'])
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
            is_verified=random.choice([True, False]),
            verification_hash=fake.sha256() if random.random() > 0.4 else None
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
