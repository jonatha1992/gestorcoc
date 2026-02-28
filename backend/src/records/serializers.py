from rest_framework import serializers
from django.conf import settings
import base64
import binascii
from .models import FilmRecord, Catalog
from assets.models import Camera
from personnel.models import Person

HASH_ALGORITHM_CHOICES = ('sha3', 'sha256', 'sha512')
VMS_AUTHENTICITY_MODE_CHOICES = (
    'vms_propio',
    'hash_preventivo',
    'sin_autenticacion',
    'otro',
)


def _video_report_max_frames():
    return int(getattr(settings, 'VIDEO_REPORT_MAX_FRAMES', 30))


def _video_report_max_frame_size_bytes():
    return int(getattr(settings, 'VIDEO_REPORT_MAX_FRAME_SIZE_BYTES', 8 * 1024 * 1024))


def _video_report_max_total_bytes():
    return int(getattr(settings, 'VIDEO_REPORT_MAX_TOTAL_BYTES', 80 * 1024 * 1024))


def _bytes_to_mb_label(size_bytes):
    mb = size_bytes / (1024 * 1024)
    if float(mb).is_integer():
        return str(int(mb))
    return f"{mb:.1f}".rstrip('0').rstrip('.')


class FilmRecordSerializer(serializers.ModelSerializer):
    """
    Serializer completo para FilmRecord con todos los campos del Excel.
    Incluye campos read-only para nombres de personas relacionadas.
    """
    # Campos read-only para mostrar nombres en lugar de solo IDs
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    operator_full_name = serializers.SerializerMethodField(read_only=True)
    received_by_full_name = serializers.SerializerMethodField(read_only=True)
    verified_by_crev_full_name = serializers.SerializerMethodField(read_only=True)
    
    def get_operator_full_name(self, obj):
        """Devuelve nombre completo del operador"""
        if obj.operator:
            return f"{obj.operator.last_name}, {obj.operator.first_name}"
        return None
    
    def get_received_by_full_name(self, obj):
        """Devuelve nombre completo de quien recepcionó"""
        if obj.received_by:
            return f"{obj.received_by.last_name}, {obj.received_by.first_name}"
        return None
    
    def get_verified_by_crev_full_name(self, obj):
        """Devuelve nombre completo del verificador CREV"""
        if obj.verified_by_crev:
            return f"{obj.verified_by_crev.last_name}, {obj.verified_by_crev.first_name}"
        return None
    
    class Meta:
        model = FilmRecord
        fields = '__all__'
        read_only_fields = ['is_editable', 'verification_date']
    
    def validate(self, data):
        """
        Validaciones personalizadas:
        1. Si el registro ya fue verificado por CREV, no se puede editar
        2. Si se está marcando como verificado, debe tener hash y backup
        """
        instance = self.instance
        
        # Validación 1: Verificar si el registro es editable
        if instance and not instance.is_editable:
            # Permitir solo agregar observaciones en registros no editables
            if set(data.keys()) - {'observations'}:
                raise serializers.ValidationError(
                    "Este registro fue verificado por CREV y no puede ser editado. "
                    "Solo puede agregar observaciones."
                )
        
        # Validación 2: Si se verifica por CREV, debe tener backup y hash
        if data.get('verified_by_crev'):
            if not data.get('has_backup'):
                raise serializers.ValidationError({
                    'verified_by_crev': 'No se puede verificar un registro sin backup.'
                })
            if not data.get('file_hash'):
                raise serializers.ValidationError({
                    'verified_by_crev': 'No se puede verificar un registro sin hash de integridad.'
                })
        
        # Validación 3: Si tiene backup, debe tener ruta
        if data.get('has_backup') and not data.get('backup_path'):
            raise serializers.ValidationError({
                'backup_path': 'Debe especificar la ruta del backup.'
            })
        
        return data

class CatalogSerializer(serializers.ModelSerializer):
    records_count = serializers.IntegerField(source='records.count', read_only=True)
    
    class Meta:
        model = Catalog
        fields = '__all__'


class VideoReportMaterialContextSerializer(serializers.Serializer):
    sistema = serializers.CharField(max_length=100, required=False, allow_blank=True)
    aeropuerto = serializers.CharField(max_length=200, required=False, allow_blank=True)
    cantidad_observada = serializers.CharField(max_length=120, required=False, allow_blank=True)
    sectores_analizados = serializers.CharField(max_length=300, required=False, allow_blank=True)
    franja_horaria_analizada = serializers.CharField(max_length=120, required=False, allow_blank=True)
    tiempo_total_analisis = serializers.CharField(max_length=120, required=False, allow_blank=True)
    sintesis_conclusion = serializers.CharField(max_length=500, required=False, allow_blank=True)
    prevencion_sumaria = serializers.CharField(max_length=100, required=False, allow_blank=True)
    caratula = serializers.CharField(max_length=500, required=False, allow_blank=True)
    fecha_hecho = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vuelo = serializers.CharField(max_length=40, required=False, allow_blank=True)
    empresa_aerea = serializers.CharField(max_length=100, required=False, allow_blank=True)
    destino = serializers.CharField(max_length=200, required=False, allow_blank=True)
    unidad = serializers.CharField(max_length=200, required=False, allow_blank=True)
    hash_algorithms = serializers.ListField(
        child=serializers.ChoiceField(choices=HASH_ALGORITHM_CHOICES),
        required=False,
        allow_empty=True,
    )
    hash_program = serializers.CharField(max_length=200, required=False, allow_blank=True)
    motivo_sin_hash = serializers.CharField(max_length=500, required=False, allow_blank=True)
    medida_seguridad_interna = serializers.CharField(max_length=300, required=False, allow_blank=True)
    vms_authenticity_mode = serializers.ChoiceField(
        choices=VMS_AUTHENTICITY_MODE_CHOICES,
        required=False,
        allow_blank=True,
    )
    vms_authenticity_detail = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, attrs):
        mode = (attrs.get('vms_authenticity_mode') or '').strip()
        detail = (attrs.get('vms_authenticity_detail') or '').strip()
        if mode == 'otro' and not detail:
            raise serializers.ValidationError({
                'vms_authenticity_detail': "Debe completar detalle cuando autenticidad = 'otro'."
            })
        return attrs


class VideoReportDataSerializer(serializers.Serializer):
    report_date = serializers.DateField(input_formats=['%Y-%m-%d'])
    destinatarios = serializers.CharField(max_length=200)
    tipo_informe = serializers.CharField(max_length=200)
    unidad = serializers.CharField(max_length=200, required=False, allow_blank=True)
    numero_informe = serializers.CharField(max_length=50)
    grado = serializers.CharField(max_length=100)
    operador = serializers.CharField(max_length=100)
    # Legacy compatibility: accepted if sent by older clients, ignored by report generation.
    dni = serializers.CharField(max_length=20, required=False, allow_blank=True, write_only=True)
    lup = serializers.CharField(max_length=30)
    sistema = serializers.CharField(max_length=100)
    cantidad_observada = serializers.CharField(max_length=120, required=False, allow_blank=True)
    sectores_analizados = serializers.CharField(max_length=300, required=False, allow_blank=True)
    franja_horaria_analizada = serializers.CharField(max_length=120, required=False, allow_blank=True)
    tiempo_total_analisis = serializers.CharField(max_length=120, required=False, allow_blank=True)
    sintesis_conclusion = serializers.CharField(max_length=500, required=False, allow_blank=True)
    hash_algorithms = serializers.ListField(
        child=serializers.ChoiceField(choices=HASH_ALGORITHM_CHOICES),
        required=False,
        allow_empty=True,
    )
    hash_program = serializers.CharField(max_length=200, required=False, allow_blank=True)
    motivo_sin_hash = serializers.CharField(max_length=500, required=False, allow_blank=True)
    medida_seguridad_interna = serializers.CharField(max_length=300, required=False, allow_blank=True)
    vms_authenticity_mode = serializers.ChoiceField(
        choices=VMS_AUTHENTICITY_MODE_CHOICES,
        required=False,
        allow_blank=True,
    )
    vms_authenticity_detail = serializers.CharField(max_length=500, required=False, allow_blank=True)
    material_filmico = serializers.CharField(required=False, allow_blank=True)
    prevencion_sumaria = serializers.CharField(max_length=100)
    caratula = serializers.CharField(max_length=500)
    fiscalia = serializers.CharField(max_length=300, required=False, allow_blank=True)
    fiscal = serializers.CharField(max_length=120, required=False, allow_blank=True)
    denunciante = serializers.CharField(max_length=120)
    vuelo = serializers.CharField(max_length=40, required=False, allow_blank=True)
    empresa_aerea = serializers.CharField(max_length=100, required=False, allow_blank=True)
    destino = serializers.CharField(max_length=200, required=False, allow_blank=True)
    fecha_hecho = serializers.CharField(max_length=50, required=False, allow_blank=True)
    aeropuerto = serializers.CharField(max_length=200, required=False, allow_blank=True)
    objeto_denunciado = serializers.CharField(max_length=200)
    desarrollo = serializers.CharField(required=False, allow_blank=True)
    conclusion = serializers.CharField(required=False, allow_blank=True)
    firma = serializers.CharField(max_length=200)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            normalized = dict(data)
            # Legacy compatibility: accepted and ignored.
            normalized.pop('unidad_aeroportuaria', None)
            normalized.pop('asiento', None)
            return super().to_internal_value(normalized)
        return super().to_internal_value(data)

    def validate(self, attrs):
        mode = (attrs.get('vms_authenticity_mode') or '').strip()
        detail = (attrs.get('vms_authenticity_detail') or '').strip()
        if mode == 'otro' and not detail:
            raise serializers.ValidationError({
                'vms_authenticity_detail': "Debe completar detalle cuando autenticidad = 'otro'."
            })
        return attrs


class VideoReportFrameSerializer(serializers.Serializer):
    ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}

    id_temp = serializers.CharField(max_length=100)
    file_name = serializers.CharField(max_length=255)
    mime_type = serializers.CharField(max_length=50)
    content_base64 = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, max_length=500)
    order = serializers.IntegerField(min_value=0)

    def validate_mime_type(self, value):
        if value not in self.ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                f"Tipo de archivo no soportado: {value}. Tipos permitidos: JPG, PNG, WEBP."
            )
        return value

    def validate_content_base64(self, value):
        try:
            payload = value.split(',', 1)[1] if ',' in value else value
            raw = base64.b64decode(payload, validate=True)
        except (ValueError, binascii.Error):
            raise serializers.ValidationError("Imagen en base64 invalida.")

        max_frame_size = _video_report_max_frame_size_bytes()
        if len(raw) > max_frame_size:
            raise serializers.ValidationError(
                f"Cada fotograma no puede superar {_bytes_to_mb_label(max_frame_size)} MB."
            )
        return value


class VideoReportPayloadSerializer(serializers.Serializer):
    report_data = VideoReportDataSerializer()
    frames = VideoReportFrameSerializer(many=True, required=False, default=list)

    def validate_frames(self, value):
        max_frames = _video_report_max_frames()
        if len(value) > max_frames:
            raise serializers.ValidationError(f"No puede adjuntar mas de {max_frames} fotogramas.")
        return value

    def validate(self, attrs):
        frames = attrs.get('frames', [])
        max_total_bytes = _video_report_max_total_bytes()
        total_bytes = 0
        orders = set()

        for index, frame in enumerate(frames):
            data = frame.get('content_base64', '')
            payload = data.split(',', 1)[1] if ',' in data else data
            raw = base64.b64decode(payload, validate=True)
            total_bytes += len(raw)
            if total_bytes > max_total_bytes:
                raise serializers.ValidationError({
                    'frames': (
                        "El tamano total de fotogramas no puede superar "
                        f"{_bytes_to_mb_label(max_total_bytes)} MB."
                    )
                })

            order = frame.get('order')
            if order in orders:
                raise serializers.ValidationError({
                    'frames': f"Orden duplicado en fotogramas (indice {index})."
                })
            orders.add(order)

        return attrs


AI_IMPROVE_MODE_CHOICES = ('material_filmico', 'desarrollo', 'conclusion', 'full')


class VideoReportImproveTextSerializer(serializers.Serializer):
    material_filmico = serializers.CharField(required=False, allow_blank=True, max_length=12000)
    desarrollo = serializers.CharField(required=False, allow_blank=True, max_length=12000)
    conclusion = serializers.CharField(required=False, allow_blank=True, max_length=12000)
    material_context = VideoReportMaterialContextSerializer(required=False)
    api_key = serializers.CharField(required=False, allow_blank=True)
    mode = serializers.ChoiceField(choices=AI_IMPROVE_MODE_CHOICES, required=False, default='full')

    def validate(self, attrs):
        material_filmico = (attrs.get('material_filmico') or '').strip()
        desarrollo = (attrs.get('desarrollo') or '').strip()
        conclusion = (attrs.get('conclusion') or '').strip()
        context = attrs.get('material_context') or {}
        has_context = False
        if isinstance(context, dict):
            for value in context.values():
                if isinstance(value, str) and value.strip():
                    has_context = True
                    break
                if isinstance(value, list) and len(value) > 0:
                    has_context = True
                    break
        if not material_filmico and not desarrollo and not conclusion and not has_context:
            raise serializers.ValidationError(
                "Debe enviar texto en 'material_filmico', 'desarrollo' o 'conclusion', "
                "o bien completar 'material_context' para mejorar con IA."
            )
        return attrs
