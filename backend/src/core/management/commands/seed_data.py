import random
from django.core.management.base import BaseCommand
from faker import Faker
from assets.models import System, Camera
from personnel.models import Person
from novedades.models import Novedad

class Command(BaseCommand):
    help = 'Seeds the database with mock data for prototyping'

    def handle(self, *args, **kwargs):
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

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
