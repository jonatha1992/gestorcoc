from rest_framework import serializers
import base64
import binascii
from .models import FilmRecord, Catalog
from assets.models import Camera
from personnel.models import Person

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


class VideoReportDataSerializer(serializers.Serializer):
    report_date = serializers.DateField(input_formats=['%Y-%m-%d'])
    destinatarios = serializers.CharField(max_length=200)
    tipo_informe = serializers.CharField(max_length=200)
    numero_informe = serializers.CharField(max_length=50)
    grado = serializers.CharField(max_length=100)
    operador = serializers.CharField(max_length=100)
    lup = serializers.CharField(max_length=30)
    sistema = serializers.CharField(max_length=100)
    prevencion_sumaria = serializers.CharField(max_length=100)
    caratula = serializers.CharField(max_length=500)
    fiscalia = serializers.CharField(max_length=300)
    fiscal = serializers.CharField(max_length=120)
    denunciante = serializers.CharField(max_length=120)
    vuelo = serializers.CharField(max_length=40)
    objeto_denunciado = serializers.CharField(max_length=200)
    desarrollo = serializers.CharField(required=False, allow_blank=True)
    conclusion = serializers.CharField(required=False, allow_blank=True)
    firma = serializers.CharField(max_length=200)


class VideoReportFrameSerializer(serializers.Serializer):
    ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024

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

        if len(raw) > self.MAX_FILE_SIZE:
            raise serializers.ValidationError("Cada fotograma no puede superar 5 MB.")
        return value


class VideoReportPayloadSerializer(serializers.Serializer):
    MAX_FRAMES = 20
    MAX_TOTAL_BYTES = 40 * 1024 * 1024

    report_data = VideoReportDataSerializer()
    frames = VideoReportFrameSerializer(many=True, required=False, default=list)

    def validate_frames(self, value):
        if len(value) > self.MAX_FRAMES:
            raise serializers.ValidationError("No puede adjuntar mas de 20 fotogramas.")
        return value

    def validate(self, attrs):
        frames = attrs.get('frames', [])
        total_bytes = 0
        orders = set()

        for index, frame in enumerate(frames):
            data = frame.get('content_base64', '')
            payload = data.split(',', 1)[1] if ',' in data else data
            raw = base64.b64decode(payload, validate=True)
            total_bytes += len(raw)
            if total_bytes > self.MAX_TOTAL_BYTES:
                raise serializers.ValidationError({
                    'frames': "El tamano total de fotogramas no puede superar 40 MB."
                })

            order = frame.get('order')
            if order in orders:
                raise serializers.ValidationError({
                    'frames': f"Orden duplicado en fotogramas (indice {index})."
                })
            orders.add(order)

        return attrs
