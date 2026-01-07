from django.core.management.base import BaseCommand

from core.constants import DEFAULT_CATALOGS, DEFAULT_CATALOG_ITEMS
from core.models import Catalog, CatalogItem


class Command(BaseCommand):
    help = "Seed base catalogs"

    def handle(self, *args, **options):
        for catalog_data in DEFAULT_CATALOGS:
            catalog, created = Catalog.objects.update_or_create(
                code=catalog_data["code"],
                defaults={
                    "name": catalog_data["name"],
                    "is_active": True,
                },
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} catalog: {catalog.code}")

            items = DEFAULT_CATALOG_ITEMS.get(catalog.code, [])
            for order, item in enumerate(items):
                CatalogItem.objects.update_or_create(
                    catalog=catalog,
                    code=item.get("code", ""),
                    defaults={
                        "name": item["name"],
                        "order": order,
                        "is_active": True,
                    },
                )
            if items:
                self.stdout.write(f"  Items synced: {len(items)}")

        self.stdout.write(self.style.SUCCESS("Base catalogs seeded."))
