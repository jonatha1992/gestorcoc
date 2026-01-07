from __future__ import annotations

import csv
from pathlib import Path
import tempfile

from django.test import SimpleTestCase
from openpyxl import Workbook

from inventory.importers import parse_camera_inventory_csv, parse_equipment_register


class ImportersTestCase(SimpleTestCase):
    def test_parse_equipment_register_extracts_metadata_and_items(self) -> None:
        file_path = Path(self._tmpdir()) / "sample_equipment.xlsx"
        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["1- FECHA DE SERVICIO: 01/02/2025"])
        sheet.append(["2- ORDEN DE SERVICIO: OS-123"])
        sheet.append(["3- DESPLIEGUE: OPERATIVO"])
        sheet.append(["4- ALLANAMIENTO: N/A"])
        sheet.append(["5- PROCEDIMIENTO POLICIAL: PROC-9"])
        sheet.append(["6- OTROS: SIN NOVEDAD"])
        sheet.append(
            [
                "EQUIPAMIENTO VIDEO EXTERIORES",
                "DESCRIPCIÓN",
                "MARCA/MODELO",
                "",
                "N° DE SERIE",
                "",
                "",
                "UNIDADES",
                "ESTADO DE UNIDAD",
                "ENTREGA SI/NO",
                "OBSERVACIONES",
            ]
        )
        sheet.append(["VIDEO 1", "CAMARA", "PANASONIC", "", "ABC123", "", "", "1 (UNO)", "E/S", "SI", "OK"])
        workbook.save(file_path)

        data = parse_equipment_register(file_path)

        self.assertEqual(data.service_order, "OS-123")
        self.assertIsNotNone(data.service_date)
        self.assertEqual(len(data.items), 1)
        item = data.items[0]
        self.assertEqual(item.description, "CAMARA")
        self.assertEqual(item.brand_model, "PANASONIC")
        self.assertEqual(item.serial_number, "ABC123")
        self.assertEqual(item.units, "1 (UNO)")
        self.assertEqual(item.delivered, "SI")

    def test_parse_camera_inventory_csv_maps_columns(self) -> None:
        file_path = Path(self._tmpdir()) / "cameras.csv"
        headers = [
            "Nombre de servidor",
            "Nombre del dispositivo",
            "Realizar",
            "Modelo",
            "Ubicacion",
            "ID logico",
            "ID de dispositivo",
            "Cadena de ID de la cámara",
            "Direccion IP",
            "Direccion MAC",
            "Version del firmware",
            "Version del firmware obligatoria",
            "Numero de serie",
            "Conectado",
            "Visible",
            "Indicadores de error",
            "Estado",
            "Velocidad de bits",
            "Resolucion",
            "Calidad",
            "Velocidad de imagen",
            "Cifrado",
            "Retencion",
            "Appearance Search:",
            "Reconocimiento facial:",
        ]
        rows = [
            [
                "EZE01",
                "CAM-01",
                "Avigilon",
                "H4",
                "MANGA",
                "ID 100",
                "Device,foo",
                "cam00",
                "10.0.0.1",
                "AA:BB:CC:DD:EE:FF",
                "1.0.0",
                "1.1.0",
                "SN123",
                "True",
                "False",
                "None",
                "Online",
                "2048",
                "1920x1080",
                "8",
                "15",
                "OpenSSL",
                "Grabado: 40 días",
                "Compatible",
                "No",
            ]
        ]
        with file_path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh, delimiter=";")
            writer.writerow(headers)
            writer.writerows(rows)

        parsed = parse_camera_inventory_csv(file_path)

        self.assertEqual(len(parsed), 1)
        camera = parsed[0]
        self.assertEqual(camera.device_name, "CAM-01")
        self.assertEqual(camera.server_name, "EZE01")
        self.assertTrue(camera.connected)
        self.assertFalse(camera.visible)
        self.assertEqual(camera.bitrate_kbps, 2048)
        self.assertEqual(camera.ip_address, "10.0.0.1")

    def _tmpdir(self) -> str:
        return tempfile.mkdtemp(prefix="gestorcoc-")
