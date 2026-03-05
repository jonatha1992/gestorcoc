from rest_framework import serializers
from .models import System, Server, Camera, CameramanGear, Unit

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'code', 'airport', 'parent']

class CameraSerializer(serializers.ModelSerializer):
    # Se usan SerializerMethodField para manejar cámaras con server=null
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

from .models import CameramanGear

class CameramanGearSerializer(serializers.ModelSerializer):
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

    class Meta:
        model = System
        fields = '__all__'
    
    def get_camera_count(self, obj):
        # Usa el prefetch de servers__cameras si está disponible para evitar N+1
        if hasattr(obj, '_prefetched_objects_cache') and 'servers' in obj._prefetched_objects_cache:
            return sum(
                len(srv._prefetched_objects_cache.get('cameras', []))
                for srv in obj.servers.all()
                if hasattr(srv, '_prefetched_objects_cache')
            )
        return Camera.objects.filter(server__system=obj).count()
