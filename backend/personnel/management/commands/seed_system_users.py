import os
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.core.management.base import BaseCommand
from django.db import transaction

from assets.models import Unit
from personnel.access import GroupName, assign_role_group, ensure_role_groups
from personnel.models import Person, UserAccountProfile


User = get_user_model()
DEV_DEFAULT_PASSWORD = "Temp123456!"


USER_SPECS = [
    {
        "username": "admin",
        "first_name": "Admin",
        "last_name": "Sistema",
        "role": GroupName.ADMIN,
        "person_role": Person.ROLE_ADMIN,
        "badge_number": "900001",
        "unit_code": "CREV",
        "is_superuser": True,
    },
    {
        "username": "coord_coc_1",
        "first_name": "Coordinador",
        "last_name": "COC",
        "role": GroupName.COORDINADOR_COC,
        "person_role": Person.ROLE_COORDINADOR_COC,
        "badge_number": "900002",
        "unit_code": "AEP",
        "is_superuser": False,
    },
    {
        "username": "coord_crev_1",
        "first_name": "Coordinador",
        "last_name": "CREV",
        "role": GroupName.COORDINADOR_CREV,
        "person_role": Person.ROLE_COORDINADOR_CREV,
        "badge_number": "900003",
        "unit_code": "CREV",
        "is_superuser": False,
    },
    {
        "username": "crev_1",
        "first_name": "Operador",
        "last_name": "CREV",
        "role": GroupName.CREV,
        "person_role": Person.ROLE_CREV,
        "badge_number": "900004",
        "unit_code": "CREV",
        "is_superuser": False,
    },
    {
        "username": "operador_1",
        "first_name": "Operador",
        "last_name": "Sistema",
        "role": GroupName.OPERADOR,
        "person_role": Person.ROLE_OPERADOR,
        "badge_number": "900005",
        "unit_code": "AEP",
        "is_superuser": False,
    },
    {
        "username": "generico_1",
        "first_name": "Consulta",
        "last_name": "General",
        "role": GroupName.READ_ONLY,
        "person_role": None,
        "badge_number": None,
        "unit_code": None,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Crea o actualiza las cuentas iniciales del sistema con grupos y perfiles."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="Reaplica las contrasenas tomadas de variables de entorno incluso si el usuario ya existe.",
        )

    def handle(self, *args, **options):
        ensure_role_groups()
        reset_passwords = options["reset_passwords"]

        with transaction.atomic():
            for spec in USER_SPECS:
                self._sync_user(spec, reset_passwords=reset_passwords)

        self.stdout.write(self.style.SUCCESS("Usuarios iniciales sincronizados correctamente."))

    def _sync_user(self, spec, reset_passwords=False):
        password = self._get_password(spec["username"])
        username = spec["username"]
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "first_name": spec["first_name"],
                "last_name": spec["last_name"],
                "is_staff": spec["is_superuser"],
                "is_superuser": spec["is_superuser"],
                "is_active": True,
            },
        )

        fields_to_update = []
        for field_name in ("first_name", "last_name"):
            if getattr(user, field_name) != spec[field_name]:
                setattr(user, field_name, spec[field_name])
                fields_to_update.append(field_name)

        if user.is_staff != spec["is_superuser"]:
            user.is_staff = spec["is_superuser"]
            fields_to_update.append("is_staff")
        if user.is_superuser != spec["is_superuser"]:
            user.is_superuser = spec["is_superuser"]
            fields_to_update.append("is_superuser")
        if not user.is_active:
            user.is_active = True
            fields_to_update.append("is_active")

        if created or reset_passwords:
            user.set_password(password)
            fields_to_update.append("password")

        if fields_to_update:
            user.save(update_fields=fields_to_update)

        profile, _ = UserAccountProfile.objects.get_or_create(user=user)
        if not profile.must_change_password:
            profile.must_change_password = True
            profile.save(update_fields=["must_change_password"])

        assign_role_group(user, spec["role"])

        person_role = spec.get("person_role")
        if person_role:
            unit = self._resolve_unit(spec.get("unit_code"))
            person, _ = Person.objects.get_or_create(
                badge_number=spec["badge_number"],
                defaults={
                    "first_name": spec["first_name"],
                    "last_name": spec["last_name"],
                    "role": person_role,
                    "rank": "CIVIL",
                    "unit": unit,
                    "is_active": True,
                    "user": user,
                },
            )
            changed = []
            updates = {
                "first_name": spec["first_name"],
                "last_name": spec["last_name"],
                "role": person_role,
                "rank": "CIVIL",
                "unit": unit,
                "is_active": True,
                "user": user,
            }
            for field_name, value in updates.items():
                if getattr(person, field_name) != value:
                    setattr(person, field_name, value)
                    changed.append(field_name)
            if changed:
                person.save(update_fields=changed)
            self.stdout.write(f"- {username}: {person.get_role_display()} ({person.badge_number})")
            return

        existing_person = getattr(user, "person", None)
        if existing_person is not None:
            existing_person.user = None
            existing_person.save(update_fields=["user"])
        self.stdout.write(f"- {username}: {spec['role']}")

    def _resolve_unit(self, unit_code):
        if not unit_code:
            return None
        unit = Unit.objects.filter(code=unit_code).first()
        if unit is not None:
            return unit
        return Unit.objects.order_by("code").first()

    def _get_password(self, username):
        sanitized = re.sub(r"[^A-Z0-9]+", "_", username.upper())
        env_name = f"SYSTEM_USER_PASSWORD_{sanitized}"
        password = os.getenv(env_name) or os.getenv("SYSTEM_USERS_DEFAULT_PASSWORD")
        if password:
            return password
        if settings.DEBUG:
            return DEV_DEFAULT_PASSWORD
        raise ImproperlyConfigured(
            f"Falta definir {env_name} o SYSTEM_USERS_DEFAULT_PASSWORD para sincronizar al usuario '{username}'."
        )
