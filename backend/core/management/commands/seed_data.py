import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import F, Q
from django.utils import timezone
from faker import Faker

from assets.models import Camera, CameramanGear, Server, System, Unit
from hechos.models import Hecho
from novedades.models import Novedad
from personnel.models import Person
from records.models import Catalog, FilmRecord


class Command(BaseCommand):
    help = "Seeds the database with mock data for prototyping"

    def handle(self, *args, **kwargs):
        random.seed(42)
        fake = Faker("es_AR")
        fake.seed_instance(42)

        self.stdout.write("Clearing old data...")

        # Order matters!
        Catalog.objects.all().delete()
        FilmRecord.objects.all().delete()
        Hecho.objects.all().delete()
        Novedad.objects.all().delete()
        Person.objects.all().delete()
        Camera.objects.all().delete()
        Server.objects.all().delete()
        System.objects.all().delete()
        Unit.objects.all().delete()
        CameramanGear.objects.all().delete()

        self.stdout.write("Seeding data...")

        # 1. Units (Hierarchy: CREV is parent of COCs)
        crev_obj = Unit.objects.create(name="CREV", code="CREV")

        units_data = [
            {"name": "Aeroparque", "code": "AEP", "parent": crev_obj},
            {"name": "Ezeiza", "code": "EZE", "parent": crev_obj},
            {"name": "San Fernando", "code": "FDO", "parent": crev_obj},
            {"name": "Bahia Blanca", "code": "BHI", "parent": crev_obj},
            {"name": "Mar del Plata", "code": "MDQ", "parent": crev_obj},
        ]

        created_units = {"CREV": crev_obj}
        created_systems = []
        created_servers = []
        created_cameras = []

        for u_data in units_data:
            unit_obj = Unit.objects.create(
                name=u_data["name"],
                code=u_data["code"],
                parent=u_data["parent"],
            )
            created_units[u_data["code"]] = unit_obj

            sys_name = f"CCTV {u_data['name']}"
            if u_data["code"] == "AEP":
                sys_name = "Milestone AEP"
            if u_data["code"] == "EZE":
                sys_name = "Avigilon EZE"

            sys_obj = System.objects.create(
                name=sys_name,
                unit=unit_obj,
                system_type="CCTV",
            )
            created_systems.append(sys_obj)

            server_count = 8 if u_data["code"] == "EZE" else 1
            for i in range(server_count):
                srv_name = f"SRV-{u_data['code']}-{i + 1:02d}"
                octet = {
                    "AEP": 10,
                    "EZE": 20,
                    "FDO": 30,
                    "BHI": 40,
                    "MDQ": 50,
                }.get(u_data["code"], 99)
                ip = f"10.{octet}.1.{10 + i}"

                server_obj = Server.objects.create(
                    name=srv_name,
                    system=sys_obj,
                    ip_address=ip,
                )
                created_servers.append(server_obj)

                for j in range(5):
                    cam_name = f"CAM-{u_data['code']}-{i + 1}-{j + 1:03d}"
                    cam_ip = f"10.{octet}.100.{j + 1}"
                    camera_obj = Camera.objects.create(
                        name=cam_name,
                        server=server_obj,
                        ip_address=cam_ip,
                        status=random.choice(["ONLINE", "ONLINE", "ONLINE", "OFFLINE"]),
                        resolution="1080p",
                    )
                    created_cameras.append(camera_obj)

        self.stdout.write(
            f"Created {len(created_units)} Units, {len(created_systems)} Systems, "
            f"{len(created_servers)} Servers and {len(created_cameras)} Cameras."
        )

        # 2. Cameraman Gear
        gear_items = [
            {"name": "Chaleco Prensa", "serial": "CHK-001", "assigned": "Juan Perez"},
            {"name": "Radio Motorola", "serial": "RAD-552", "assigned": "Juan Perez"},
            {"name": "Bateria Extra", "serial": "BAT-999", "assigned": "Maria Gonzalez"},
            {"name": "Casco", "serial": "CAS-101", "assigned": None},
        ]
        created_gear = []
        for item in gear_items:
            created_gear.append(
                CameramanGear.objects.create(
                    name=item["name"],
                    serial_number=item["serial"],
                    assigned_to=item["assigned"],
                )
            )
        self.stdout.write(f"Created {len(created_gear)} Cameraman Gear items.")

        # 3. Personnel
        roles = ["OPERATOR", "SUPERVISOR", "ADMIN"]
        unit_codes = list(created_units.keys())
        created_people = []

        for _ in range(20):
            u_code = random.choice(unit_codes)
            unit_obj = created_units[u_code]
            unit_systems = System.objects.filter(unit=unit_obj)

            person = Person.objects.create(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                badge_number=f"L-{random.randint(1000, 9999)}",
                role=random.choice(roles),
                unit=unit_obj,
                is_active=random.choice([True, True, True, False]),
            )
            created_people.append(person)

            if unit_systems.exists():
                person.assigned_systems.set(unit_systems)

        self.stdout.write(f"Created {len(created_people)} Personnel distributed across units.")

        # 4. Film Records
        request_types = ["OFICIO", "NOTA", "EXHORTO", "OTRO"]
        crime_types = [
            "Hurto",
            "Robo",
            "Amenaza",
            "Danos",
            "Averiguacion de ilicito",
        ]
        delivery_statuses = ["PENDIENTE", "ENTREGADO", "ANULADO"]
        created_records = []

        for i in range(90):
            camera = random.choice(created_cameras)
            operator = random.choice(created_people)
            received_by = random.choice(created_people) if random.random() > 0.30 else None

            start_time = fake.date_time_between(
                start_date="-365d",
                end_date="-1d",
                tzinfo=timezone.get_current_timezone(),
            )
            end_time = start_time + timedelta(minutes=random.randint(15, 240))

            has_backup = random.random() > 0.20
            is_integrity_verified = random.random() > 0.40
            if is_integrity_verified:
                has_backup = True

            backup_path = (
                f"/mnt/backups/coc/{start_time.strftime('%Y/%m/%d')}/record_{i + 1:03d}.mp4"
                if has_backup
                else None
            )

            file_hash = None
            if is_integrity_verified:
                file_hash = fake.sha256()
            elif random.random() > 0.70:
                file_hash = fake.sha256()

            record = FilmRecord.objects.create(
                issue_number=f"AS-2026-{1000 + i}",
                order_number=i + 1,
                entry_date=start_time.date(),
                request_type=random.choice(request_types),
                request_number=f"{fake.random_int(min=1000, max=9999)}/2026",
                requester=random.choice(
                    [
                        "Juzgado Federal Nro 1",
                        "Fiscalia Federal",
                        "Policia de Seguridad Aeroportuaria",
                        "Ministerio Publico Fiscal",
                    ]
                ),
                judicial_case_number=f"C-{fake.random_int(min=10000, max=99999)}/2026",
                case_title=fake.sentence(nb_words=6),
                incident_date=start_time.date(),
                crime_type=random.choice(crime_types),
                intervening_department=f"COC {camera.server.system.unit.code}",
                camera=camera,
                operator=operator,
                received_by=received_by,
                start_time=start_time,
                end_time=end_time,
                record_type=random.choice(["VD", "VD", "IM", "OT"]),
                description=(
                    f"Oficio Judicial Nro {fake.random_int(min=1000, max=9999)}/2026 "
                    "- Requerimiento de evidencia"
                ),
                has_backup=has_backup,
                backup_path=backup_path,
                file_hash=file_hash,
                file_size=random.randint(30_000_000, 2_000_000_000) if has_backup else None,
                is_integrity_verified=is_integrity_verified,
                delivery_status=random.choice(delivery_statuses),
                observations=fake.sentence(nb_words=10) if random.random() > 0.55 else "",
            )
            created_records.append(record)

        # 5. Catalogs
        catalog_names = [
            "Fiscalia Federal 1",
            "Juzgado de Garantias",
            "Auditoria Interna CREV",
        ]

        created_catalogs = []
        for name in catalog_names:
            catalog = Catalog.objects.create(name=name)
            selected_records = random.sample(
                created_records,
                k=min(len(created_records), random.randint(8, 15)),
            )
            catalog.records.add(*selected_records)
            created_catalogs.append(catalog)

        # 6. Novedades (exactly one linked asset per row)
        incident_types = [
            "FALLA_TECNICA",
            "DESCONEXION",
            "OBJETO_SOSPECHOSO",
            "DISTURBIO",
            "SOPORTE",
        ]
        severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        statuses = ["OPEN", "IN_PROGRESS", "CLOSED"]
        asset_kinds = ["camera", "server", "system", "gear"]

        created_novedades = []
        for i in range(60):
            asset_kind = asset_kinds[i % len(asset_kinds)]
            payload = {
                "description": fake.paragraph(nb_sentences=2),
                "incident_type": incident_types[i % len(incident_types)],
                "severity": severities[i % len(severities)],
                "status": statuses[i % len(statuses)],
                "reported_by": (
                    f"{created_people[i % len(created_people)].first_name} "
                    f"{created_people[i % len(created_people)].last_name}"
                ),
                "external_ticket_id": f"DGT-{10000 + i}" if i % 2 == 0 else None,
            }

            if asset_kind == "camera":
                payload["camera"] = created_cameras[i % len(created_cameras)]
            elif asset_kind == "server":
                payload["server"] = created_servers[i % len(created_servers)]
            elif asset_kind == "system":
                payload["system"] = created_systems[i % len(created_systems)]
            else:
                payload["cameraman_gear"] = created_gear[i % len(created_gear)]

            nov = Novedad.objects.create(**payload)
            backdated_ts = fake.date_time_between(
                start_date="-365d",
                end_date="now",
                tzinfo=timezone.get_current_timezone(),
            )
            Novedad.objects.filter(pk=nov.pk).update(created_at=backdated_ts)
            created_novedades.append(nov)

        # 7. Hechos — distribuidos en 12 meses + densidad últimos 30 días
        hecho_categories = ["POLICIAL", "OPERATIVO", "INFORMATIVO", "RELEVAMIENTO"]
        hecho_descriptions = [
            "Deteccion de pasajero con conducta sospechosa en zona de embarque, se solicita intervencion.",
            "Alerta de sistema CCTV por perdida de senal en camara del sector bodegas.",
            "Incidente con vehiculo de rampa sin autorizacion en plataforma norte.",
            "Disturbio entre pasajeros en area de check-in, interviene personal de seguridad.",
            "Objeto abandonado sin identificar detectado en zona de migraciones.",
            "Persona no autorizada intentando acceder a zona restringida de plataforma.",
            "Falla en sistema de control de acceso en terminal A, se activa protocolo manual.",
            "Colision menor entre equipos de rampa en sector de carga, sin lesionados.",
            "Reporte de actitud sospechosa de personal en zona de bodegas.",
            "Pasajero extraviado localizado en sector de puertas de embarque.",
        ]
        sectors = [
            "Plataforma Norte",
            "Check-in Terminal A",
            "Acceso Principal",
            "Sector Bodegas",
            "Migraciones",
        ]
        elements_options = [
            "Equipaje, personal de rampa",
            "Pasajeros, cinta transportadora",
            "Vehiculo utilitario, barreras",
            "Personal de seguridad, vallado",
            "Elementos varios",
        ]
        groups_options = [
            "PSA",
            "PSA y SAME",
            "PSA y Policia Local",
            "PSA y Bomberos",
            "Sin intervencion externa",
        ]
        created_hechos = []

        def _create_hecho(i, start_date, end_date):
            timestamp = fake.date_time_between(
                start_date=start_date,
                end_date=end_date,
                tzinfo=timezone.get_current_timezone(),
            )
            solved = random.random() > 0.45
            end_time = timestamp + timedelta(minutes=random.randint(10, 180)) if solved else None
            return Hecho.objects.create(
                timestamp=timestamp,
                description=random.choice(hecho_descriptions),
                camera=random.choice(created_cameras) if random.random() > 0.10 else None,
                category=hecho_categories[i % len(hecho_categories)],
                reported_by=random.choice(created_people) if random.random() > 0.15 else None,
                sector=random.choice(sectors),
                elements=random.choice(elements_options),
                intervening_groups=random.choice(groups_options),
                is_solved=solved,
                coc_intervention=random.random() > 0.35,
                generated_cause=random.random() > 0.65,
                end_time=end_time,
                resolution_time=f"{random.randint(15, 180)} min" if solved else None,
                resolution_details=fake.sentence(nb_words=10) if solved else "",
                external_ref=f"HEC-2026-{1000 + i}" if i % 3 == 0 else None,
            )

        # Tramo 1: 70 hechos distribuidos en los últimos 12 meses (sin los últimos 30 días)
        for i in range(70):
            created_hechos.append(_create_hecho(i, "-365d", "-31d"))

        # Tramo 2: 80 hechos en los últimos 30 días (visibilidad en gráfico diario)
        for i in range(80):
            created_hechos.append(_create_hecho(70 + i, "-30d", "now"))

        # 8. Validation summary
        invalid_time_count = FilmRecord.objects.filter(start_time__gte=F("end_time")).count()
        invalid_backup_count = FilmRecord.objects.filter(
            has_backup=True
        ).filter(Q(backup_path__isnull=True) | Q(backup_path="")).count()
        invalid_hash_count = FilmRecord.objects.filter(
            is_integrity_verified=True
        ).filter(Q(file_hash__isnull=True) | Q(file_hash="")).count()

        invalid_novedad_targets = 0
        for novedad in Novedad.objects.all():
            targets = [
                novedad.camera_id,
                novedad.server_id,
                novedad.system_id,
                novedad.cameraman_gear_id,
            ]
            non_null_targets = len([target for target in targets if target is not None])
            if non_null_targets != 1:
                invalid_novedad_targets += 1

        self.stdout.write("Data summary:")
        self.stdout.write(f"- Units: {Unit.objects.count()}")
        self.stdout.write(f"- Systems: {System.objects.count()}")
        self.stdout.write(f"- Servers: {Server.objects.count()}")
        self.stdout.write(f"- Cameras: {Camera.objects.count()}")
        self.stdout.write(f"- Gear: {CameramanGear.objects.count()}")
        self.stdout.write(f"- Personnel: {Person.objects.count()}")
        self.stdout.write(f"- Film Records: {FilmRecord.objects.count()}")
        self.stdout.write(f"- Novedades: {Novedad.objects.count()}")
        self.stdout.write(f"- Hechos: {Hecho.objects.count()}")
        self.stdout.write(f"- Catalogs: {Catalog.objects.count()}")
        self.stdout.write("Integrity checks:")
        self.stdout.write(f"- invalid start/end range: {invalid_time_count}")
        self.stdout.write(f"- backup without path: {invalid_backup_count}")
        self.stdout.write(f"- verified without hash: {invalid_hash_count}")
        self.stdout.write(f"- novedades with invalid target count: {invalid_novedad_targets}")

        self.stdout.write(self.style.SUCCESS("Successfully seeded database!"))
