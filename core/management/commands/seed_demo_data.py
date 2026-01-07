import os
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.constants import ROLE_NAMES
from core.models import Catalog, CatalogItem, CctvSystem, OrganizationalUnit, Role
from documents.models import Document, DocumentPriority, DocumentStatus, DocumentType, FilmRecord, FilmRecordStatus
from inventory.models import Camera, CameraStatus, Equipment, EquipmentStatus
from operations.models import Detector, Hecho

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo data (dev-only). Assumes seed_roles and seed_catalogs ran first."

    def handle(self, *args, **options):
        admin_role = Role.objects.filter(name=ROLE_NAMES["ADMIN"]).first()
        if not admin_role:
            self.stdout.write(self.style.WARNING("Roles not found. Run seed_roles first."))
            return

        # Admin user
        password = os.environ.get("DJANGO_DEMO_ADMIN_PASSWORD", "admin1234")
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "is_staff": True, "is_superuser": True},
        )
        if created:
            admin_user.set_password(password)
            admin_user.save()
        self.stdout.write(f"Admin user ready: {admin_user.username}")

        # Organizational structure
        unit, _ = OrganizationalUnit.objects.get_or_create(name="CREV Central", defaults={"description": "Unidad principal"})
        system, _ = CctvSystem.objects.get_or_create(
            unit=unit,
            name="Sistema Principal",
            defaults={"description": "VMS central", "ip_address": "10.0.0.10", "location": "Sala de Control"},
        )

        # Catalog items helpers (self-healing if seed_catalogs was skipped)
        def ensure_item(catalog_code: str, name: str, code: str, order: int = 0) -> CatalogItem:
            catalog, _ = Catalog.objects.get_or_create(code=catalog_code, defaults={"name": catalog_code.title()})
            item, _ = CatalogItem.objects.get_or_create(
                catalog=catalog,
                code=code,
                defaults={"name": name, "order": order, "is_active": True},
            )
            return item

        cat_category = ensure_item("CATEGORIAS", "Camara IP", "CAT_CAM_IP")
        cat_location = ensure_item("UBICACIONES", "Sala de Control", "UB_CTRL")
        cat_camera_type = ensure_item("TIPOS_CAMARA", "Domo", "CAM_DOMO")
        cat_org = ensure_item("ORGANISMOS", "Policia", "ORG_POL")
        cat_tipo_solicitud = ensure_item("TIPOS_SOLICITUD", "Judicial", "SOL_JUD")
        cat_tipo_delito = ensure_item("TIPOS_DELITO", "Robo", "DEL_ROBO")

        # Equipment
        Equipment.objects.get_or_create(
            name="Servidor VMS 01",
            defaults={
                "category": cat_category,
                "location": cat_location,
                "serial_number": "VMS-001",
                "brand": "Dell",
                "model": "R740",
                "status": EquipmentStatus.AVAILABLE,
                "org_unit": unit,
                "created_by": admin_user,
            },
        )

        # Camera
        Camera.objects.get_or_create(
            name="Camara Domo 01",
            defaults={
                "location": cat_location,
                "camera_type": cat_camera_type,
                "status": CameraStatus.ONLINE,
                "ip_address": "10.0.1.20",
                "serial_number": "CAM-001",
                "org_unit": unit,
                "org_system": system,
                "created_by": admin_user,
            },
        )

        # Document
        Document.objects.get_or_create(
            reference_number="EXP-2024-001",
            defaults={
                "doc_type": DocumentType.ENTRADA,
                "date": date.today(),
                "sender": "CREV",
                "recipient": "COC",
                "subject": "Alta de expediente inicial",
                "description": "Documento de ejemplo",
                "status": DocumentStatus.PENDIENTE,
                "priority": DocumentPriority.MEDIA,
                "created_by": admin_user,
            },
        )

        # Film record
        FilmRecord.objects.get_or_create(
            nro_asunto="REG-2024-001",
            defaults={
                "estado": FilmRecordStatus.PENDIENTE,
                "fecha_ingreso": date.today() - timedelta(days=1),
                "tipo_solicitud": cat_tipo_solicitud,
                "tipo_delito": cat_tipo_delito,
                "organismo": cat_org,
                "org_unit": unit,
                "org_system": system,
                "created_by": admin_user,
            },
        )

        # Hecho
        Hecho.objects.get_or_create(
            nro_orden=1,
            defaults={
                "fecha_intervencion": timezone.now() - timedelta(hours=1),
                "novedad": "Camara sin video",
                "quien_detecta": Detector.MONITOREO,
                "elementos": "Switch PoE",
                "sector": "Sala de Control",
                "solucionado_coc": True,
                "genero_causa": False,
                "observaciones": "Reinicio de VMS",
                "created_by": admin_user,
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded (dev use only)."))
