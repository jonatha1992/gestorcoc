import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, F, Max, Q
from django.utils import timezone
from faker import Faker

from assets.models import Camera, CameramanGear, Server, System, Unit
from hechos.models import Hecho
from novedades.models import Novedad
from personnel.models import Person
from records.models import Catalog, FilmRecord, FilmRecordInvolvedPerson


class Command(BaseCommand):
    help = "Seed mock data with reset/fill_missing/append modes."
    ROOT_UNIT_CODE = "CREV"
    ROOT_UNIT_NAME = "CREV I"

    TARGETS = {
        "low": {"personnel": 12, "gear": 12, "film_records": 40, "novedades": 30, "hechos": 60},
        "medium": {"personnel": 20, "gear": 20, "film_records": 90, "novedades": 60, "hechos": 150},
        "high": {"personnel": 40, "gear": 40, "film_records": 220, "novedades": 180, "hechos": 420},
    }

    # Importante:
    # Los valores guardados en DB son codigos tecnicos (ingles) por compatibilidad
    # con choices/modelos. Las etiquetas que ve el usuario estan en espanol.
    NOV_SEVERITIES = [value for value, _ in Novedad.SEVERITY_CHOICES]
    NOV_STATUSES = [value for value, _ in Novedad.STATUS_CHOICES]
    CAMERA_STATUSES = [value for value, _ in Camera.STATUS_CHOICES]
    GEAR_CONDITIONS = [value for value, _ in CameramanGear.CONDITION_CHOICES]
    HECHO_CATEGORIES = ["POLICIAL", "OPERATIVO", "INFORMATIVO", "RELEVAMIENTO"]
    ROLE_TARGETS = {
        "low": {"ADMIN": 1, "COORDINADOR_COC": 2, "OPERADOR": 5, "CREV": 2, "COORDINADOR_CREV": 2},
        "medium": {"ADMIN": 2, "COORDINADOR_COC": 3, "OPERADOR": 8, "CREV": 4, "COORDINADOR_CREV": 3},
        "high": {"ADMIN": 4, "COORDINADOR_COC": 6, "OPERADOR": 16, "CREV": 8, "COORDINADOR_CREV": 6},
    }

    def add_arguments(self, parser):
        parser.add_argument("--mode", choices=["reset", "fill_missing", "append"], default="fill_missing")
        parser.add_argument("--volume", choices=["low", "medium", "high"], default="medium")
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        self.mode = options["mode"]
        self.volume = options["volume"]
        self.seed = options["seed"]
        self.dry_run = options["dry_run"]
        self.created = {k: 0 for k in ["units", "systems", "servers", "cameras", "gear", "personnel", "film_records", "novedades", "hechos", "catalogs"]}
        self.normalized = {k: 0 for k in ["records_entry_date", "records_request_type", "records_delivery_status", "records_backup_flag", "records_verified_by_crev", "records_generator_unit", "novedades_shape", "hechos_category", "person_guard_group"]}
        self.fake = Faker("es_AR")
        self.fake.seed_instance(self.seed)
        random.seed(self.seed)

        self.stdout.write(f"Seed start | mode={self.mode} volume={self.volume} seed={self.seed} dry_run={self.dry_run}")
        if self.dry_run:
            with transaction.atomic():
                self._run()
                transaction.set_rollback(True)
                self.stdout.write(self.style.WARNING("Dry-run complete."))
            return
        self._run()

    def _run(self):
        if self.mode == "reset":
            for model in [Catalog, FilmRecord, Hecho, Novedad, Person, Camera, Server, System, Unit, CameramanGear]:
                model.objects.all().delete()

        units = self._ensure_units()
        systems, servers, cameras = self._ensure_topology(units)
        people = self._ensure_personnel(units)
        gear = self._ensure_gear(people)
        self._ensure_records(cameras, people)
        self._ensure_novedades(cameras, servers, systems, gear, people)
        self._ensure_hechos(cameras, people)
        self._ensure_catalogs()
        self._normalize(cameras)
        self._report()

    def _missing(self, current, target):
        return target if self.mode == "append" else max(0, target - current)

    def _ensure_units(self):
        defs = [
            (self.ROOT_UNIT_CODE, self.ROOT_UNIT_NAME, "Buenos Aires", "Buenos Aires", None, None, False, None),
            ("AEP", "COC Aeroparque", "Aeroparque Jorge Newbery", "Buenos Aires", Decimal("-34.559167"), Decimal("-58.415611"), True, self.ROOT_UNIT_CODE),
            ("EZE", "COC Ezeiza", "Ministro Pistarini (Ezeiza)", "Buenos Aires", Decimal("-34.822222"), Decimal("-58.535833"), True, self.ROOT_UNIT_CODE),
            ("FDO", "COC San Fernando", "San Fernando", "Buenos Aires", Decimal("-34.453333"), Decimal("-58.589611"), True, self.ROOT_UNIT_CODE),
            ("BHI", "COC Bahía Blanca", "Comandante Espora", "Buenos Aires", Decimal("-38.724167"), Decimal("-62.169278"), True, self.ROOT_UNIT_CODE),
            ("MDQ", "COC Mar del Plata", "Astor Piazzolla", "Buenos Aires", Decimal("-37.934167"), Decimal("-57.573333"), True, self.ROOT_UNIT_CODE),
        ]
        units = {}
        for code, name, airport, province, lat, lon, map_enabled, parent_code in defs:
            parent = units.get(parent_code) if parent_code else None
            unit, created = Unit.objects.get_or_create(code=code, defaults={"name": name, "airport": airport, "province": province, "latitude": lat, "longitude": lon, "map_enabled": map_enabled, "parent": parent})
            if created:
                self.created["units"] += 1
            changed = False
            for field, value in [("name", name), ("airport", airport), ("province", province), ("latitude", lat), ("longitude", lon), ("map_enabled", map_enabled)]:
                if getattr(unit, field) != value:
                    setattr(unit, field, value)
                    changed = True
            if unit.parent_id != (parent.id if parent else None):
                unit.parent = parent
                changed = True
            if changed:
                unit.save()
            units[code] = unit
        return units

    def _ensure_topology(self, units):
        topo = {
            "AEP": ("Milestone AEP", 1, 10),
            "EZE": ("Avigilon EZE", 8, 20),
            "FDO": ("CCTV San Fernando", 1, 30),
            "BHI": ("CCTV Bahía Blanca", 1, 40),
            "MDQ": ("CCTV Mar del Plata", 1, 50),
        }
        systems, servers, cameras = [], [], []
        for code, (sys_name, server_count, octet) in topo.items():
            system, created = System.objects.get_or_create(name=sys_name, defaults={"unit": units[code], "system_type": "CCTV", "is_active": True})
            if created:
                self.created["systems"] += 1
            if system.unit_id != units[code].id:
                system.unit = units[code]
                system.save(update_fields=["unit"])
            systems.append(system)
            for sidx in range(server_count):
                ip = f"10.{octet}.1.{10 + sidx}"
                srv_name = f"SRV-{code}-{sidx + 1:02d}"
                server, created = Server.objects.get_or_create(ip_address=ip, defaults={"name": srv_name, "system": system, "is_active": True})
                if created:
                    self.created["servers"] += 1
                servers.append(server)
                for cidx in range(5):
                    cam_name = f"CAM-{code}-{sidx + 1}-{cidx + 1:03d}"
                    cam = Camera.objects.filter(name=cam_name, server=server).first()
                    if cam is None:
                        preferred_camera_statuses = ["ONLINE", "ONLINE", "ONLINE", "OFFLINE"]
                        valid_statuses = [status for status in preferred_camera_statuses if status in self.CAMERA_STATUSES] or self.CAMERA_STATUSES
                        cam = Camera.objects.create(name=cam_name, server=server, ip_address=f"10.{octet}.100.{cidx + 1}", status=random.choice(valid_statuses), resolution="1080p")
                        self.created["cameras"] += 1
                    cameras.append(cam)
        return systems, servers, cameras

    def _ensure_gear(self, people):
        for name, serial in [("Chaleco Prensa", "CHK-001"), ("Radio Motorola", "RAD-552"), ("Batería Extra", "BAT-999"), ("Casco", "CAS-101")]:
            _, created = CameramanGear.objects.get_or_create(serial_number=serial, defaults={"name": name, "condition": "GOOD", "is_active": True})
            if created:
                self.created["gear"] += 1
        names = ["Cámara Portátil", "Mochila de Transmisión", "Drone", "Trípode Pesado"]
        conditions = [c for c in ["NEW", "GOOD", "GOOD", "FAIR", "POOR"] if c in self.GEAR_CONDITIONS] or self.GEAR_CONDITIONS
        for _ in range(self._missing(CameramanGear.objects.count(), self.TARGETS[self.volume]["gear"])):
            serial = self._next_serial()
            assigned_to = random.choice(people) if people and random.random() > 0.5 else None
            legacy_name = "" if assigned_to else self.fake.name()
            CameramanGear.objects.create(
                name=f"{random.choice(names)} {self.fake.random_int(min=1, max=999):03d}",
                serial_number=serial,
                assigned_to=assigned_to,
                assigned_to_name=legacy_name,
                condition=random.choice(conditions),
                is_active=random.choice([True, True, False]),
            )
            self.created["gear"] += 1
        return list(CameramanGear.objects.all())

    def _ensure_personnel(self, units):
        roles = [choice[0] for choice in Person.ROLE_CHOICES]
        coc_units = [u for code, u in units.items() if code != self.ROOT_UNIT_CODE] or list(units.values())
        root_unit = units.get(self.ROOT_UNIT_CODE)
        role_target = dict(self.ROLE_TARGETS.get(self.volume, {}))
        for role in roles:
            role_target.setdefault(role, 0)

        role_plan = []
        if self.mode == "append":
            for role in roles:
                role_plan.extend([role] * role_target.get(role, 0))
        else:
            current = {row["role"]: row["count"] for row in Person.objects.values("role").annotate(count=Count("id"))}
            for role in roles:
                missing = max(0, role_target.get(role, 0) - current.get(role, 0))
                role_plan.extend([role] * missing)

        for role in role_plan:
            unit = random.choice(coc_units)
            person = Person.objects.create(
                first_name=self.fake.first_name(),
                last_name=self.fake.last_name(),
                badge_number=self._next_badge(),
                role=role,
                rank=random.choice([value for value, _ in Person.RANK_CHOICES]),
                unit=unit,
                guard_group=random.choice(["A", "B", "C", None, ""]),
                is_active=random.choice([True, True, True, False]),
            )
            person.assigned_systems.set(System.objects.filter(unit=unit))
            self.created["personnel"] += 1
        return list(Person.objects.all())

    def _ensure_records(self, cameras, people):
        if not people:
            return
        statuses = ["PENDIENTE", "ENTREGADO", "DERIVADO", "FINALIZADO", "ANULADO"]
        request_types = ["FORMULARIO", "MEMORANDO", "NOTA", "OFICIO", "EXHORTO", "OTRO"]
        request_kinds = ["DENUNCIA", "PROCEDIMIENTO", "OTRO"]
        requesters = [
            "Juzgado Federal Nro 1",
            "Juzgado Federal Nro 3",
            "Fiscalia Federal Nro 2",
            "Fiscalia Federal Nro 5",
            "Policia de Seguridad Aeroportuaria",
            "Ministerio Publico Fiscal",
            "Prefectura Naval Argentina",
            "Gendarmeria Nacional",
        ]
        organisms = ["PSA", "PFA", "GNA", "PNA", "INTERPOL", "MPF", "CSJN"]
        criminal_problematics = [
            "Hurto de equipaje",
            "Sustraccion de efectos personales",
            "Robo en sector de embarque",
            "Danos y vandalismo",
            "Averiguacion de ilicito",
            "Estafa con equipaje",
        ]
        incident_modalities = [
            "Sustraccion en cinta",
            "Apropiacion indebida en hall",
            "Descuido de pertenencias",
            "Rotura de valija",
            "Intercambio de equipaje",
        ]
        incident_places = [
            "Hall de arribos",
            "Hall de partidas",
            "Sector check-in",
            "Area de migraciones",
            "Control de seguridad",
            "Cinta de equipajes",
        ]
        incident_sectors = [
            "Cinta 1",
            "Cinta 2",
            "Cinta 3",
            "Sector Norte",
            "Sector Sur",
            "Plataforma",
        ]
        judicial_offices = [
            "Fiscalia Federal Nro 1",
            "Fiscalia Federal Nro 2",
            "Juzgado Federal Nro 1",
            "Juzgado Federal Nro 3",
            "N/C",
        ]
        judicial_secretaries = [
            "Secretaria Penal Nro 1",
            "Secretaria Penal Nro 2",
            "Secretaria de Turno",
            "N/C",
        ]
        judicial_holders = [
            "Dr. Juan Perez",
            "Dra. Maria Gomez",
            "Dr. Carlos Sosa",
            "N/C",
        ]
        supervisors = [person for person in people if person.role in {"ADMIN", "CREV", "COORDINADOR_CREV"}]
        generator_units = list(Unit.objects.exclude(parent__isnull=True))
        base_order = FilmRecord.objects.aggregate(max_value=Max("order_number")).get("max_value") or 0
        sistemas_cctv = [
            "MILESTONE", "VIPRO", "DAHUA", "HIKVISION", "AVIGILON",
            "AXIS", "BOSCH VIDEOJET", "NVR DAHUA", "DVR HIKVISION", "GENETEC",
        ]
        for i in range(self._missing(FilmRecord.objects.count(), self.TARGETS[self.volume]["film_records"])):
            operator = random.choice(people)
            start = self.fake.date_time_between(start_date="-365d", end_date="now", tzinfo=timezone.get_current_timezone())
            end = start + timedelta(minutes=random.randint(15, 240))
            has_backup = random.random() > 0.20
            verified = random.random() > 0.40 and bool(supervisors)
            if verified:
                has_backup = True
            verifier = random.choice(supervisors) if verified else None
            delivered = random.choice(statuses)
            dvd_num = f"DVD-{start.year}-{self.fake.random_int(min=100, max=999)}" if random.random() > 0.40 else None
            report_num = f"{self.fake.random_int(min=100, max=999)}CREV-{str(start.year)[2:]}" if random.random() > 0.50 else None
            exp_num = f"EXP-{self.fake.random_int(min=10000, max=99999)}/{start.year}" if random.random() > 0.60 else None
            act_num = f"ACTA-{self.fake.random_int(min=100, max=999)}/{start.year}" if delivered in ("ENTREGADO", "FINALIZADO") else None
            delivery_date = (start + timedelta(days=random.randint(1, 90))).date() if act_num else None
            retrieved = self.fake.last_name() if act_num else None
            judicial_office = random.choice(judicial_offices)
            generator_unit = None
            if operator.unit and random.random() > 0.35:
                generator_unit = operator.unit
            elif generator_units and random.random() > 0.40:
                generator_unit = random.choice(generator_units)
            record = FilmRecord.objects.create(
                issue_number=f"AS-{start.year}-{1000 + base_order + i}",
                order_number=base_order + i + 1,
                entry_date=start.date(),
                request_type=random.choice(request_types),
                request_kind=random.choice(request_kinds),
                request_number=f"{self.fake.random_int(min=1000, max=9999)}/{start.year}",
                requester=judicial_office if judicial_office != "N/C" else random.choice(requesters),
                judicial_case_number=f"C-{self.fake.random_int(min=10000, max=99999)}/{start.year}",
                case_title=self.fake.sentence(nb_words=6),
                incident_date=start.date(),
                incident_time=start.time().replace(second=0, microsecond=0),
                incident_place=random.choice(incident_places),
                incident_sector=random.choice(incident_sectors),
                crime_type=random.choice(["Hurto", "Robo", "Amenaza", "Daños", "Averiguacion de ilicito", "Estafa"]),
                criminal_problematic=random.choice(criminal_problematics),
                incident_modality=random.choice(incident_modalities),
                intervening_department=random.choice(["COC AER", "COC EZE", "COC IGU", "COC COR", "COC MDZ"]),
                judicial_office=judicial_office,
                judicial_secretary=random.choice(judicial_secretaries),
                judicial_holder=random.choice(judicial_holders),
                generator_unit=generator_unit,
                sistema=random.choice(sistemas_cctv),
                operator=operator,
                received_by=random.choice(people) if random.random() > 0.30 else None,
                start_time=start,
                end_time=end,
                description=f"Oficio Judicial Nro {self.fake.random_int(min=1000, max=9999)}/{start.year}",
                dvd_number=dvd_num,
                report_number=report_num,
                ifgra_number=f"IFGRA-{self.fake.random_int(min=1000, max=9999)}" if random.random() > 0.70 else None,
                expediente_number=exp_num,
                delivery_act_number=act_num,
                delivery_date=delivery_date,
                retrieved_by=retrieved,
                organism=random.choice(organisms) if act_num else None,
                has_backup=has_backup,
                backup_path=f"/mnt/backups/coc/{start.strftime('%Y/%m/%d')}/record_{base_order + i + 1:03d}.mp4" if has_backup else None,
                file_hash=self.fake.sha256() if verified or random.random() > 0.70 else None,
                file_size=random.randint(30_000_000, 2_000_000_000) if has_backup else None,
                is_integrity_verified=verified,
                verified_by_crev=verifier,
                verification_date=end if verifier else None,
                delivery_status=delivered,
                observations=self.fake.sentence(nb_words=10) if random.random() > 0.55 else "",
            )
            self._seed_involved_people(record)
            self.created["film_records"] += 1

    def _seed_involved_people(self, record):
        total_people = random.randint(1, 4)
        roles = ["DAMNIFICADO", "DENUNCIANTE", "DETENIDO", "OTRO"]
        assigned_roles = []

        # En la mayoria de casos incluimos al menos un denunciante para pruebas de Informe.
        if random.random() > 0.25:
            assigned_roles.append("DENUNCIANTE")
        while len(assigned_roles) < total_people:
            assigned_roles.append(random.choice(roles))
        random.shuffle(assigned_roles)

        entries = []
        for role in assigned_roles:
            birth_date = self.fake.date_of_birth(minimum_age=18, maximum_age=80)
            entries.append(
                FilmRecordInvolvedPerson(
                    film_record=record,
                    role=role,
                    last_name=self.fake.last_name(),
                    first_name=self.fake.first_name(),
                    document_type=random.choice(["DNI", "PASAPORTE", "LC"]),
                    document_number=str(self.fake.random_int(min=10000000, max=45999999)),
                    nationality=random.choice(["Argentina", "Uruguaya", "Paraguaya", "Boliviana", "Chilena"]),
                    birth_date=birth_date,
                )
            )
        FilmRecordInvolvedPerson.objects.bulk_create(entries)

    def _ensure_novedades(self, cameras, servers, systems, gear, people):
        if not any([cameras, servers, systems, gear]):
            return
        incident_types = ["FALLA_TECNICA", "DESCONEXION", "OBJETO_SOSPECHOSO", "DISTURBIO", "SOPORTE"]
        for i in range(self._missing(Novedad.objects.count(), self.TARGETS[self.volume]["novedades"])):
            reporter = random.choice(people) if people and random.random() > 0.5 else None
            payload = {
                "description": self.fake.paragraph(nb_sentences=2),
                "incident_type": incident_types[i % len(incident_types)],
                "severity": self.NOV_SEVERITIES[i % len(self.NOV_SEVERITIES)],
                "status": self.NOV_STATUSES[i % len(self.NOV_STATUSES)],
                "reported_by": reporter,
                "reporter_name": "" if reporter else self.fake.name(),
                "external_ticket_id": f"DGT-{10000 + i}" if i % 2 == 0 else None,
            }
            kind = i % 4
            if kind == 0 and cameras:
                payload["camera"] = cameras[i % len(cameras)]
            elif kind == 1 and servers:
                payload["server"] = servers[i % len(servers)]
            elif kind == 2 and systems:
                payload["system"] = systems[i % len(systems)]
            elif gear:
                payload["cameraman_gear"] = gear[i % len(gear)]
            nov = Novedad.objects.create(**payload)
            recent = i < max(6, self.TARGETS[self.volume]["novedades"] // 4)
            created_at = self.fake.date_time_between(
                start_date="-14d" if recent else "-365d",
                end_date="now",
                tzinfo=timezone.get_current_timezone(),
            )
            Novedad.objects.filter(pk=nov.pk).update(
                created_at=created_at
            )
            self.created["novedades"] += 1

    def _ensure_hechos(self, cameras, people):
        desc = [
            "Detección de conducta sospechosa en zona de embarque.",
            "Alerta de CCTV por pérdida de señal en sector de bodegas.",
            "Incidente con vehículo de rampa sin autorización.",
            "Disturbio entre pasajeros en área de check-in.",
            "Objeto abandonado sin identificar en migraciones.",
            "Persona sin autorización intentando acceder a zona restringida.",
        ]
        for i in range(self._missing(Hecho.objects.count(), self.TARGETS[self.volume]["hechos"])):
            recent = random.random() > 0.45
            ts = self.fake.date_time_between(start_date="-30d" if recent else "-365d", end_date="now" if recent else "-31d", tzinfo=timezone.get_current_timezone())
            solved = random.random() > 0.45
            Hecho.objects.create(
                timestamp=ts,
                description=random.choice(desc),
                camera=random.choice(cameras) if cameras and random.random() > 0.10 else None,
                category=self.HECHO_CATEGORIES[i % len(self.HECHO_CATEGORIES)],
                reported_by=random.choice(people) if people and random.random() > 0.15 else None,
                sector=random.choice(["Plataforma Norte", "Check-in Terminal A", "Acceso Principal", "Sector Bodegas", "Migraciones"]),
                elements=random.choice([
                    "Equipaje, personal de rampa",
                    "Pasajeros, cinta transportadora",
                    "Vehículo utilitario, barreras",
                    "Personal de seguridad, vallado",
                    "Elementos varios",
                ]),
                intervening_groups=random.choice([
                    "PSA",
                    "PSA y SAME",
                    "PSA y Policía Local",
                    "PSA y Bomberos",
                    "Sin intervención externa",
                ]),
                is_solved=solved,
                coc_intervention=random.random() > 0.35,
                generated_cause=random.random() > 0.65,
                end_time=ts + timedelta(minutes=random.randint(10, 180)) if solved else None,
                resolution_time=f"{random.randint(15, 180)} min" if solved else None,
                resolution_details=self.fake.sentence(nb_words=10) if solved else "",
                external_ref=f"HEC-{timezone.now().year}-{1000 + i}" if i % 3 == 0 else None,
            )
            self.created["hechos"] += 1

    def _ensure_catalogs(self):
        for name in ["Fiscalía Federal 1", "Juzgado de Garantías", "Auditoría Interna CREV"]:
            catalog, created = Catalog.objects.get_or_create(name=name)
            if created:
                self.created["catalogs"] += 1
            if catalog.records.count() == 0:
                recs = list(FilmRecord.objects.order_by("?")[: random.randint(5, 15)])
                if recs:
                    catalog.records.add(*recs)

    def _normalize(self, fallback_cameras):
        self.normalized["records_request_type"] += FilmRecord.objects.filter(Q(request_type__isnull=True) | Q(request_type="")).update(request_type="OTRO")
        self.normalized["records_delivery_status"] += FilmRecord.objects.filter(Q(delivery_status__isnull=True) | Q(delivery_status="")).update(delivery_status="PENDIENTE")
        self.normalized["records_backup_flag"] += FilmRecord.objects.filter(has_backup=False).exclude(Q(backup_path__isnull=True) | Q(backup_path="")).update(has_backup=True)
        for record in FilmRecord.objects.filter(entry_date__isnull=True).exclude(start_time__isnull=True):
            record.entry_date = record.start_time.date()
            record.save(update_fields=["entry_date"])
            self.normalized["records_entry_date"] += 1

        supervisors = list(Person.objects.filter(role__in=["ADMIN", "CREV", "COORDINADOR_CREV"]))
        if supervisors:
            for record in FilmRecord.objects.filter(is_integrity_verified=True, verified_by_crev__isnull=True):
                record.verified_by_crev = random.choice(supervisors)
                record.verification_date = record.verification_date or record.end_time or timezone.now()
                record.is_editable = False
                record.save(update_fields=["verified_by_crev", "verification_date", "is_editable"])
                self.normalized["records_verified_by_crev"] += 1

        for nov in Novedad.objects.all():
            changed = False
            sev = (nov.severity or "").strip().upper()
            sta = (nov.status or "").strip().upper()
            inc = (nov.incident_type or "").strip().upper().replace(" ", "_")
            rep = (nov.reporter_name or "").strip()

            if sev not in self.NOV_SEVERITIES:
                nov.severity = "MEDIUM"
                changed = True
            elif nov.severity != sev:
                nov.severity = sev
                changed = True

            if sta not in self.NOV_STATUSES:
                nov.status = "OPEN"
                changed = True
            elif nov.status != sta:
                nov.status = sta
                changed = True

            if nov.incident_type != (inc or "SIN_CLASIFICAR"):
                nov.incident_type = inc or "SIN_CLASIFICAR"
                changed = True

            if nov.reported_by_id:
                if nov.reporter_name != "":
                    nov.reporter_name = ""
                    changed = True
            elif nov.reporter_name != rep:
                nov.reporter_name = rep
                changed = True

            ids = [nov.camera_id, nov.server_id, nov.system_id, nov.cameraman_gear_id]
            non_null = [x for x in ids if x is not None]
            if len(non_null) == 0 and fallback_cameras:
                nov.camera = random.choice(fallback_cameras)
                changed = True
            elif len(non_null) > 1:
                keep = next((f for f in ["camera_id", "server_id", "system_id", "cameraman_gear_id"] if getattr(nov, f) is not None), None)
                nov.camera_id = nov.camera_id if keep == "camera_id" else None
                nov.server_id = nov.server_id if keep == "server_id" else None
                nov.system_id = nov.system_id if keep == "system_id" else None
                nov.cameraman_gear_id = nov.cameraman_gear_id if keep == "cameraman_gear_id" else None
                changed = True

            if changed:
                nov.save()
                self.normalized["novedades_shape"] += 1

        for hecho in Hecho.objects.all():
            cat = (hecho.category or "").strip().upper()
            if cat not in self.HECHO_CATEGORIES:
                hecho.category = "OPERATIVO"
                hecho.save(update_fields=["category"])
                self.normalized["hechos_category"] += 1

        self.normalized["person_guard_group"] += Person.objects.filter(guard_group="").update(guard_group=None)

        # Backfill generator_unit for records where it's null — distribuye entre las unidades del mapa
        map_units = list(Unit.objects.filter(map_enabled=True))
        if map_units:
            null_records = list(FilmRecord.objects.filter(generator_unit__isnull=True))
            for i, record in enumerate(null_records):
                record.generator_unit = map_units[i % len(map_units)]
                record.save(update_fields=["generator_unit"])
                self.normalized["records_generator_unit"] += 1

    def _distribution(self, qs, field):
        return list(qs.values(field).annotate(count=Count("id")).order_by("-count"))

    def _invalid_novedad_targets(self):
        invalid = 0
        for nov in Novedad.objects.only("camera_id", "server_id", "system_id", "cameraman_gear_id"):
            if len([x for x in [nov.camera_id, nov.server_id, nov.system_id, nov.cameraman_gear_id] if x is not None]) != 1:
                invalid += 1
        return invalid

    def _report(self):
        self.stdout.write("")
        self.stdout.write("Created:")
        for k, v in self.created.items():
            self.stdout.write(f"- {k}: {v}")
        self.stdout.write("")
        self.stdout.write("Normalized:")
        for k, v in self.normalized.items():
            self.stdout.write(f"- {k}: {v}")
        self.stdout.write("")
        self.stdout.write("Totals:")
        for label, model in [("units", Unit), ("systems", System), ("servers", Server), ("cameras", Camera), ("gear", CameramanGear), ("personnel", Person), ("film_records", FilmRecord), ("novedades", Novedad), ("hechos", Hecho), ("catalogs", Catalog)]:
            self.stdout.write(f"- {label}: {model.objects.count()}")
        self.stdout.write("")
        self.stdout.write("Distributions:")
        self.stdout.write(f"- novedades severity: {self._distribution(Novedad.objects, 'severity')}")
        self.stdout.write(f"- novedades status: {self._distribution(Novedad.objects, 'status')}")
        self.stdout.write(f"- hechos category: {self._distribution(Hecho.objects, 'category')}")
        self.stdout.write(f"- records delivery_status: {self._distribution(FilmRecord.objects, 'delivery_status')}")
        self.stdout.write(f"- personnel role: {self._distribution(Person.objects, 'role')}")
        self.stdout.write(f"- camera status: {self._distribution(Camera.objects, 'status')}")
        self.stdout.write("")
        self.stdout.write("Integrity:")
        self.stdout.write(f"- invalid start/end range: {FilmRecord.objects.filter(start_time__gte=F('end_time')).count()}")
        self.stdout.write(f"- backup without path: {FilmRecord.objects.filter(has_backup=True).filter(Q(backup_path__isnull=True) | Q(backup_path='')).count()}")
        self.stdout.write(f"- verified without hash: {FilmRecord.objects.filter(is_integrity_verified=True).filter(Q(file_hash__isnull=True) | Q(file_hash='')).count()}")
        self.stdout.write(f"- records missing entry_date: {FilmRecord.objects.filter(entry_date__isnull=True).count()}")
        self.stdout.write(f"- records missing request_type: {FilmRecord.objects.filter(Q(request_type__isnull=True) | Q(request_type='')).count()}")
        self.stdout.write(f"- novedades invalid targets: {self._invalid_novedad_targets()}")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Seed command completed successfully."))

    def _next_badge(self):
        while True:
            badge = f"{random.randint(0, 999999):06d}"
            if not Person.objects.filter(badge_number=badge).exists():
                return badge

    def _next_serial(self):
        while True:
            serial = f"GEA-{random.randint(100000, 999999)}"
            if not CameramanGear.objects.filter(serial_number=serial).exists():
                return serial


