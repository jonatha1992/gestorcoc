from django.core.management.base import BaseCommand

from core.constants import DEFAULT_ROLES_CONFIG
from core.models import Role


class Command(BaseCommand):
    help = "Seed default roles and permissions"

    def handle(self, *args, **options):
        for role_config in DEFAULT_ROLES_CONFIG:
            role, created = Role.objects.update_or_create(
                name=role_config["name"],
                defaults={
                    "is_system": role_config.get("is_system", False),
                    "is_active": True,
                    "permissions": role_config.get("permissions", []),
                },
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} role: {role.name}")
        self.stdout.write(self.style.SUCCESS("Default roles seeded."))
