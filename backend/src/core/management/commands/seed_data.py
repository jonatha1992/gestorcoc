import random
from django.core.management.base import BaseCommand
from faker import Faker
<<<<<<< HEAD
from assets.models import System, Camera
from personnel.models import Person
from novedades.models import Novedad
=======
from assets.models import System, Camera, Server, CameramanGear, Unit
from personnel.models import Person
from novedades.models import Novedad
from records.models import FilmRecord, Catalog
>>>>>>> dev

class Command(BaseCommand):
    help = 'Seeds the database with mock data for prototyping'

    def handle(self, *args, **kwargs):
<<<<<<< HEAD
        fake = Faker()
        self.stdout.write('Seeding data...')

        # 1. Systems
        systems = []
        for i in range(5):
            sys_name = f"SITE-{i:02d}-NVR"
            sys_obj, created = System.objects.get_or_create(
                name=sys_name,
                defaults={'ip_address': f"192.168.1.{10+i}"}
            )
            systems.append(sys_obj)
        self.stdout.write(f"Created {len(systems)} Systems.")

        # 2. Cameras
        cameras = []
        for sys in systems:
            for c in range(10): # 10 cameras per system
                cam = Camera.objects.create(
                    system=sys,
                    name=f"CAM-{sys.name}-{c:02d}",
                    ip_address=f"192.168.1.{100+c}",
                    status=random.choice(['ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']),
                    resolution='1080p'
                )
                cameras.append(cam)
        self.stdout.write(f"Created {len(cameras)} Cameras.")

        # 3. Personnel
        people = []
        for _ in range(20):
            p = Person.objects.create(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                badge_number=fake.unique.random_number(digits=5),
                role=random.choice(['OPERATOR', 'SUPERVISOR', 'GUARD'])
            )
            people.append(p)
        self.stdout.write(f"Created {len(people)} Personnel.")

        # 4. Novedades
        for _ in range(15):
            Novedad.objects.create(
                camera=random.choice(cameras),
                description=fake.sentence(),
                severity=random.choice(['LOW', 'MEDIUM', 'HIGH']),
                status=random.choice(['OPEN', 'IN_PROGRESS', 'CLOSED']),
                reported_by=random.choice(people).last_name
            )
        self.stdout.write("Created 15 Novedades.")

=======
        fake = Faker('es_AR')
        self.stdout.write('Clearing old data...')
        
        # Order matters!
        Catalog.objects.all().delete()
        FilmRecord.objects.all().delete()
        Novedad.objects.all().delete()
        Person.objects.all().delete()
        Camera.objects.all().delete()
        Server.objects.all().delete()
        System.objects.all().delete()
        Unit.objects.all().delete()
        CameramanGear.objects.all().delete()

        self.stdout.write('Seeding data...')

        # 1. Units (Hierarchy: CREV is parent of COCs)
        crev_obj, _ = Unit.objects.get_or_create(name='CREV', code='CREV')
        
        units_data = [
            {'name': 'Aeroparque', 'code': 'AEP', 'parent': crev_obj},
            {'name': 'Ezeiza', 'code': 'EZE', 'parent': crev_obj},
            {'name': 'San Fernando', 'code': 'FDO', 'parent': crev_obj},
            {'name': 'Bahía Blanca', 'code': 'BHI', 'parent': crev_obj},
            {'name': 'Mar del Plata', 'code': 'MDQ', 'parent': crev_obj},
        ]

        created_units = {'CREV': crev_obj}
        created_systems = []

        for u_data in units_data:
            # Create Unit
            unit_obj, _ = Unit.objects.get_or_create(
                name=u_data['name'], 
                code=u_data['code'],
                defaults={'parent': u_data['parent']}
            )
            created_units[u_data['code']] = unit_obj
            
            # Create Main CCTV System for this Unit (COCs only)
            sys_name = f"CCTV {u_data['name']}"
            if u_data['code'] == 'AEP': sys_name = "Milestone AEP"
            if u_data['code'] == 'EZE': sys_name = "Avigilon EZE"

            # Create System linked to Unit
            sys_obj, _ = System.objects.get_or_create(
                name=sys_name,
                defaults={
                    'unit': unit_obj,
                    'system_type': 'CCTV'
                }
            )
            # Make sure it's linked if it already existed
            if not sys_obj.unit:
                sys_obj.unit = unit_obj
                sys_obj.save()

            created_systems.append(sys_obj)
            
            # Create Servers
            server_count = 8 if u_data['code'] == 'EZE' else 1
            for i in range(server_count):
                srv_name = f"SRV-{u_data['code']}-{i+1:02d}"
                # logic for IP: 10.x.y.z
                # AEP=10, EZE=20, FDO=30, BHI=40, MDQ=50
                octet = {'AEP': 10, 'EZE': 20, 'FDO': 30, 'BHI': 40, 'MDQ': 50}.get(u_data['code'], 99)
                ip = f"10.{octet}.1.{10+i}"
                
                server_obj, _ = Server.objects.get_or_create(
                    name=srv_name,
                    system=sys_obj,
                    defaults={'ip_address': ip}
                )

                # Create Cameras
                for j in range(5):
                    cam_name = f"CAM-{u_data['code']}-{i+1}-{j+1:03d}"
                    cam_ip = f"10.{octet}.100.{j+1}"
                    Camera.objects.get_or_create(
                        name=cam_name,
                        server=server_obj,
                        defaults={
                            'ip_address': cam_ip,
                            'status': random.choice(['ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']),
                            'resolution': '1080p'
                        }
                    )
        
        self.stdout.write(f"Created {len(created_units)} Units and {len(created_systems)} Systems.")

        # 2. Cameraman Gear
        gear_items = [
            {'name': 'Chaleco Prensa', 'serial': 'CHK-001', 'assigned': 'Juan Perez'},
            {'name': 'Radio Motorola', 'serial': 'RAD-552', 'assigned': 'Juan Perez'},
            {'name': 'Batería Extra', 'serial': 'BAT-999', 'assigned': 'Maria Gonzalez'},
            {'name': 'Casco', 'serial': 'CAS-101', 'assigned': None},
        ]
        for g in gear_items:
            CameramanGear.objects.get_or_create(
                name=g['name'],
                serial_number=g['serial'],
                defaults={'assigned_to': g['assigned']}
            )
        self.stdout.write("Created Cameraman Gear.")

        # 3. Personnel
        roles = ['OPERATOR', 'SUPERVISOR', 'ADMIN']
        unit_codes = list(created_units.keys())

        for i in range(20):
            u_code = random.choice(unit_codes)
            unit_obj = created_units[u_code]
            
            # Get systems for this unit
            unit_systems = System.objects.filter(unit=unit_obj)

            person = Person.objects.create(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                badge_number=f"L-{random.randint(1000, 9999)}",
                role=random.choice(roles),
                unit=unit_obj,  # Link to Unit object (ForeignKey)
                is_active=random.choice([True, True, True, False])
            )
            
            # Assign systems belonging to that unit
            if unit_systems.exists():
                person.assigned_systems.set(unit_systems)

        self.stdout.write("Created 20 Personnel distributed across units.")
>>>>>>> dev
        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
