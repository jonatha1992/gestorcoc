"""
One-time script: backfill generator_unit for FilmRecords that have it as NULL.
Distributes records round-robin across all map-enabled units.
Run: python fix_generator_unit.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assets.models import Unit
from records.models import FilmRecord
from django.db import connection

map_units = list(Unit.objects.filter(map_enabled=True).order_by('code'))
if not map_units:
    print("No map-enabled units found. Aborting.")
    exit(1)

null_ids = list(FilmRecord.objects.filter(generator_unit__isnull=True).values_list('id', flat=True))
print(f"Records to fix: {len(null_ids)}")

if not null_ids:
    print("Nothing to fix.")
    exit(0)

# Build a single bulk UPDATE using CASE ... WHEN for efficiency
unit_ids = [u.id for u in map_units]
cases = " ".join(
    f"WHEN id = {rid} THEN {unit_ids[i % len(unit_ids)]}"
    for i, rid in enumerate(null_ids)
)
ids_csv = ",".join(str(i) for i in null_ids)
sql = f"UPDATE records_filmrecord SET generator_unit_id = CASE {cases} END WHERE id IN ({ids_csv})"

with connection.cursor() as cursor:
    cursor.execute(sql)
    print(f"Updated {cursor.rowcount} records.")

# Verify
for u in map_units:
    cnt = FilmRecord.objects.filter(generator_unit=u).count()
    print(f"  {u.code} ({u.name}): {cnt} registros")
