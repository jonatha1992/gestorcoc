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
from assets.models import System, Server, Camera, Unit, CameramanGear
from novedades.models import Novedad
from personnel.models import Person
from records.models import FilmRecord, Catalog

fake = Faker(['es_ES'])

def seed():
    print("Clearing existing data...")
    Catalog.objects.all().delete()
    FilmRecord.objects.all().delete()
    Novedad.objects.all().delete()
    CameramanGear.objects.all().delete()
    Camera.objects.all().delete()
    Server.objects.all().delete()
    System.objects.all().delete()
    Person.objects.all().delete()
    User.objects.exclude(username='admin').delete()
    Unit.objects.all().delete()
    
    print("Seeding database with mock data (BULK MODE)...")
    
    # --- 1. Units ---
    print("Creating Units...")
    units_data = [
        {'name': 'COC Ezeiza', 'code': 'EZE', 'airport': 'Ezeiza'},
        {'name': 'COC Aeroparque', 'code': 'AEP', 'airport': 'Aeroparque'},
        {'name': 'CREP Central', 'code': 'CREP', 'airport': 'Buenos Aires'},
        {'name': 'COC Córdoba', 'code': 'COR', 'airport': 'Pajas Blancas'},
    ]
    units_objs = [Unit(**d) for d in units_data]
    Unit.objects.bulk_create(units_objs)
    units = list(Unit.objects.all())
    units_map = {u.code: u for u in units}
    
    # --- 2. Users and Personnel ---
    print("Creating Specific Users and Personnel...")
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    
    roles = ['OPERATOR', 'SUPERVISOR', 'ADMIN', 'TECHNICAL']
    people_objs = []
    
    # Specific staff
    people_objs.append(Person(
        badge_number='5001', first_name='Operador 1', last_name='Ezeiza',
        role='OPERATOR', rank='Oficial Primero', unit=units_map['EZE'], is_active=True
    ))
    people_objs.append(Person(
        badge_number='5002', first_name='Operador 2', last_name='Aeroparque',
        role='OPERATOR', rank='Oficial de Guardia', unit=units_map['AEP'], is_active=True
    ))
    people_objs.append(Person(
        badge_number='5003', first_name='Fiscalizador', last_name='CREP',
        role='SUPERVISOR', rank='Comisionado', unit=units_map['CREP'], is_active=True
    ))
    
    # Bulk create additional personnel
    for i in range(15):
        people_objs.append(Person(
            badge_number=f"4{i:03d}",
            first_name=fake.first_name(), last_name=fake.last_name(),
            role=random.choice(roles),
            rank=random.choice(['Oficial', 'Suboficial', 'Cabo']),
            unit=random.choice(units)
        ))
    
    Person.objects.bulk_create(people_objs)
    all_people = list(Person.objects.all())

    # --- 3. Topology (Systems, Servers, Cameras) ---
    print("Creating Topology (BULK)...")
    topology_map = {
        'EZE': ['Avigilon', 'Genetec', 'Bosch VMS'],
        'AEP': ['Milestone', 'Avigilon'],
        'CREP': ['ISS SecurOS', 'HikCentral'],
        'COR': ['Dahua DSS', 'Milestone']
    }
    
    systems_to_create = []
    for u_code, sys_types in topology_map.items():
        unit_obj = units_map[u_code]
        for sys_type in sys_types:
            systems_to_create.append(System(
                name=f"{sys_type} {u_code}",
                system_type='CCTV',
                unit=unit_obj,
                is_active=True
            ))
    System.objects.bulk_create(systems_to_create)
    all_systems = list(System.objects.all())
    
    servers_to_create = []
    for s_idx, s_obj in enumerate(all_systems):
        u_code = s_obj.unit.code
        sys_name = s_obj.name.split()[0]
        for i in range(4): # 4 Servers per System instead of 8
            servers_to_create.append(Server(
                name=f"SRV-{u_code}-{sys_name[:3].upper()}-{i+1:02d}",
                system=s_obj,
                ip_address=f"10.{100 + list(units_map.keys()).index(u_code)}.{s_idx + 10}.{i+1}",
                is_active=True
            ))
    Server.objects.bulk_create(servers_to_create)
    all_servers = list(Server.objects.all())
    
    cameras_to_create = []
    f_res = ['1080p', '4MP', '5MP', '4K']
    for srv_idx, srv_obj in enumerate(all_servers):
        u_code = srv_obj.system.unit.code
        for j in range(5): # 5 Cameras per Server instead of 20 (Total ~180 cameras)
            cameras_to_create.append(Camera(
                name=f"CAM-{srv_obj.name}-{j+1:02d}",
                server=srv_obj,
                ip_address=fake.unique.ipv4(),
                status=random.choice(['ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']),
                resolution=random.choice(f_res)
            ))
    Camera.objects.bulk_create(cameras_to_create)
    all_cameras = list(Camera.objects.all())

    # --- 4. Gear ---
    print("Creating Cameraman Gear...")
    gear_names = ['Cámara Portátil', 'Mochila de Transmisión', 'Drone', 'Trípode Pesado']
    conditions = ['NEW', 'GOOD', 'GOOD', 'FAIR', 'POOR']
    gear_objs = []
    for i in range(20):
        gear_objs.append(CameramanGear(
            name=f"{random.choice(gear_names)} - {i+1:02d}",
            serial_number=fake.unique.bothify(text='SN-######'),
            assigned_to=f"{random.choice(all_people).first_name} {random.choice(all_people).last_name}",
            condition=random.choice(conditions),
            is_active=random.choice([True, True, False])
        ))
    CameramanGear.objects.bulk_create(gear_objs)

    # --- 5. Records ---
    print("Creating Film Records...")
    record_objs = []
    for _ in range(50):
        camera = random.choice(all_cameras)
        operator = random.choice(all_people)
        start = fake.date_time_between(start_date='-30d', end_date='now', tzinfo=timezone.get_current_timezone())
        duration = random.randint(15, 180)
        record_objs.append(FilmRecord(
            camera=camera, operator=operator,
            start_time=start, end_time=start + timedelta(minutes=duration),
            description=f"Oficio Judicial Nro {fake.numerify(text='####/2026')}",
            record_type=random.choice(['VD', 'VD', 'IM']),
            is_integrity_verified=random.choice([True, False]),
            file_hash=fake.sha256() if random.random() > 0.4 else None,
            delivery_status=random.choice(['PENDIENTE', 'ENTREGADO', 'FINALIZADO'])
        ))
    FilmRecord.objects.bulk_create(record_objs)
    all_records = list(FilmRecord.objects.all())

    # --- 6. Novedades ---
    print("Creating Novedades...")
    novedad_objs = []
    for _ in range(30):
        novedad_objs.append(Novedad(
            camera=random.choice(all_cameras),
            description=fake.paragraph(nb_sentences=2),
            incident_type=random.choice(['FALLA_TECNICA', 'DESCONEXION', 'EVENTO']),
            severity=random.choice(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
            status=random.choice(['OPEN', 'IN_PROGRESS', 'CLOSED']),
            reported_by=random.choice(all_people).first_name
        ))
    Novedad.objects.bulk_create(novedad_objs)

    print("Seeding complete (BULK). Total cameras:", len(all_cameras))

if __name__ == "__main__":
    seed()
