from __future__ import annotations

from pathlib import Path
from typing import Iterable, List

from django.core.management.base import BaseCommand

from inventory.importers import parse_camera_inventory_csv, parse_equipment_register
from inventory.models import CameraInventoryRecord, EquipmentRegister, EquipmentRegisterItem


class Command(BaseCommand):
    help = "Importa planillas de equipamiento y CSVs de cámaras al modelo de inventario."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--equipment-path",
            action="append",
            dest="equipment_paths",
            default=[],
            help="Ruta (o patrón glob) a archivos de entrega/recepción de equipamiento (xlsx).",
        )
        parser.add_argument(
            "--camera-path",
            action="append",
            dest="camera_paths",
            default=[],
            help="Ruta (o patrón glob) a CSVs de inventario de cámaras.",
        )

    def handle(self, *args, **options) -> None:
        equipment_paths = self._collect_paths(options.get("equipment_paths") or self._default_equipment_paths())
        camera_paths = self._collect_paths(options.get("camera_paths") or self._default_camera_paths())

        for path in equipment_paths:
            data = parse_equipment_register(path)
            register, _ = EquipmentRegister.objects.update_or_create(
                source_name=data.source_name,
                defaults={
                    "checksum": data.checksum,
                    "service_date_text": data.service_date_text,
                    "service_date": data.service_date,
                    "service_order": data.service_order,
                    "deployment": data.deployment,
                    "allanamiento": data.allanamiento,
                    "police_procedure": data.police_procedure,
                    "other_notes": data.other_notes,
                    "raw_metadata": data.raw_metadata,
                },
            )
            EquipmentRegisterItem.objects.filter(register=register).delete()
            EquipmentRegisterItem.objects.bulk_create(
                [
                    EquipmentRegisterItem(
                        register=register,
                        section_label=item.section_label,
                        description=item.description,
                        brand_model=item.brand_model,
                        serial_number=item.serial_number,
                        units=item.units,
                        unit_status=item.unit_status,
                        delivered=item.delivered,
                        observations=item.observations,
                        raw_row=item.raw_row,
                    )
                    for item in data.items
                ]
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"[equipamiento] {path.name}: {len(data.items)} registros guardados (service {data.service_date_text or 'N/D'})"
                )
            )

        for path in camera_paths:
            rows = parse_camera_inventory_csv(path)
            CameraInventoryRecord.objects.filter(source_name=path.name).delete()
            CameraInventoryRecord.objects.bulk_create(
                [
                    CameraInventoryRecord(
                        source_name=row.source_name,
                        server_name=row.server_name,
                        device_name=row.device_name,
                        vendor=row.vendor,
                        model=row.model,
                        location=row.location,
                        logical_id=row.logical_id,
                        device_id=row.device_id,
                        camera_id=row.camera_id,
                        ip_address=row.ip_address,
                        mac_address=row.mac_address,
                        firmware_version=row.firmware_version,
                        firmware_required=row.firmware_required,
                        serial_number=row.serial_number,
                        connected=row.connected,
                        visible=row.visible,
                        error_indicators=row.error_indicators,
                        state=row.state,
                        bitrate_kbps=row.bitrate_kbps,
                        resolution=row.resolution,
                        quality=row.quality,
                        frame_rate=row.frame_rate,
                        encryption=row.encryption,
                        retention=row.retention,
                        appearance_search=row.appearance_search,
                        face_recognition=row.face_recognition,
                        raw_row=row.raw_row,
                    )
                    for row in rows
                ]
            )
            self.stdout.write(self.style.SUCCESS(f"[cámaras] {path.name}: {len(rows)} registros guardados"))

    def _collect_paths(self, patterns: Iterable[str]) -> List[Path]:
        paths: List[Path] = []
        for pattern in patterns:
            expanded = list(Path().glob(pattern))
            if expanded:
                paths.extend(expanded)
            else:
                path = Path(pattern)
                if path.exists():
                    paths.append(path)
        return paths

    def _default_equipment_paths(self) -> List[str]:
        return ["informacion/ENTREGA*EQUIPO*.xlsx"]

    def _default_camera_paths(self) -> List[str]:
        return [
            "informacion/*.csv",
            "data/*.csv",
        ]
