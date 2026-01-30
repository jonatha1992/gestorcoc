from rest_framework import serializers
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
