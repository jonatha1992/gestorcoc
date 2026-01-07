from core.forms import BaseModelForm

from .models import Camera, Equipment


class EquipmentForm(BaseModelForm):
    class Meta:
        model = Equipment
        fields = [
            "name",
            "category",
            "location",
            "parent_equipment",
            "serial_number",
            "brand",
            "model",
            "status",
            "description",
            "qr_code",
            "org_unit",
        ]


class CameraForm(BaseModelForm):
    class Meta:
        model = Camera
        fields = [
            "name",
            "location",
            "camera_type",
            "status",
            "ip_address",
            "serial_number",
            "brand",
            "model",
            "installation_date",
            "notes",
            "org_unit",
            "org_system",
        ]
