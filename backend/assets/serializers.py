import base64
import binascii

from django.conf import settings
from rest_framework import serializers

from .models import System, Server, Camera, CameramanGear, Unit

HASH_ALGORITHM_CHOICES = ('sha1', 'sha3', 'sha256', 'sha512', 'otro')


def _camera_photo_max_size_bytes():
    return int(getattr(settings, 'CAMERA_PHOTO_MAX_SIZE_BYTES', 250 * 1024))


def _bytes_to_kb_label(size_bytes):
    kb = size_bytes / 1024
    if float(kb).is_integer():
        return str(int(kb))
    return f"{kb:.1f}".rstrip('0').rstrip('.')


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = [
            'id',
            'name',
            'code',
            'airport',
            'province',
            'latitude',
            'longitude',
            'map_enabled',
            'parent',
        ]


class CameraSerializer(serializers.ModelSerializer):
    ALLOWED_PHOTO_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

    # Se usan SerializerMethodField para manejar camaras con server=null
    # (el FK admite null=True, y los campos con source anidado fallan silenciosamente ante None)
    server_name = serializers.SerializerMethodField()
    system_name = serializers.SerializerMethodField()
    system = serializers.SerializerMethodField()

    class Meta:
        model = Camera
        fields = '__all__'

    def get_server_name(self, obj):
        return obj.server.name if obj.server else None

    def get_system_name(self, obj):
        if obj.server and obj.server.system:
            return obj.server.system.name
        return None

    def get_system(self, obj):
        if obj.server and obj.server.system:
            return obj.server.system.id
        return None

    def validate_photo_data(self, value):
        raw_value = str(value or '').strip()
        if not raw_value:
            return ''

        if ',' not in raw_value:
            raise serializers.ValidationError('La foto debe enviarse como data URL base64.')

        header, payload = raw_value.split(',', 1)
        if not header.startswith('data:') or ';base64' not in header:
            raise serializers.ValidationError('La foto debe enviarse como data URL base64.')

        mime_type = header[5:].split(';', 1)[0].strip().lower()
        if mime_type not in self.ALLOWED_PHOTO_MIME_TYPES:
            raise serializers.ValidationError(
                'Tipo de imagen no soportado. Tipos permitidos: JPG, PNG o WEBP.'
            )

        try:
            raw = base64.b64decode(payload, validate=True)
        except (ValueError, binascii.Error):
            raise serializers.ValidationError('La foto contiene base64 invalido.')

        max_size = _camera_photo_max_size_bytes()
        if len(raw) > max_size:
            raise serializers.ValidationError(
                f'La foto no puede superar {_bytes_to_kb_label(max_size)} KB.'
            )

        return raw_value


class CameramanGearSerializer(serializers.ModelSerializer):
    assigned_to_display = serializers.SerializerMethodField(read_only=True)

    def get_assigned_to_display(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.last_name}, {obj.assigned_to.first_name}"
        return obj.assigned_to_name or ''

    class Meta:
        model = CameramanGear
        fields = '__all__'


class ServerSerializer(serializers.ModelSerializer):
    cameras = CameraSerializer(many=True, read_only=True)
    system_name = serializers.CharField(source='system.name', read_only=True)

    class Meta:
        model = Server
        fields = '__all__'


class SystemSerializer(serializers.ModelSerializer):
    servers = ServerSerializer(many=True, read_only=True)
    camera_count = serializers.SerializerMethodField()
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, required=False, allow_null=True
    )
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    report_native_hash_algorithms_default = serializers.ListField(
        child=serializers.ChoiceField(choices=HASH_ALGORITHM_CHOICES),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = System
        fields = '__all__'

    def get_camera_count(self, obj):
        # Usa el prefetch de servers__cameras si esta disponible para evitar N+1
        if hasattr(obj, '_prefetched_objects_cache') and 'servers' in obj._prefetched_objects_cache:
            return sum(
                len(srv._prefetched_objects_cache.get('cameras', []))
                for srv in obj.servers.all()
                if hasattr(srv, '_prefetched_objects_cache')
            )
        return Camera.objects.filter(server__system=obj).count()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        mode = (attrs.get('report_authenticity_mode_default') or '').strip()
        detail = (attrs.get('report_authenticity_detail_default') or '').strip()
        algorithms = attrs.get('report_native_hash_algorithms_default')

        if algorithms is None and self.instance is not None:
            algorithms = self.instance.report_native_hash_algorithms_default or []

        if mode != 'otro':
            attrs['report_authenticity_detail_default'] = ''

        if 'otro' not in (algorithms or []):
            attrs['report_native_hash_algorithm_other_default'] = ''

        if mode == 'otro' and not detail:
            raise serializers.ValidationError({
                'report_authenticity_detail_default': "Debe completar el detalle cuando el metodo sugerido es 'otro'."
            })

        return attrs
