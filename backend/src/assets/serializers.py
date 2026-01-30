from rest_framework import serializers
from .models import System, Server, Camera, CameramanGear, Unit

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'code']

class CameraSerializer(serializers.ModelSerializer):
    server_name = serializers.CharField(source='server.name', read_only=True)
    system_name = serializers.CharField(source='server.system.name', read_only=True)
    system = serializers.IntegerField(source='server.system.id', read_only=True)

    class Meta:
        model = Camera
        fields = '__all__'

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
        return Camera.objects.filter(server__system=obj).count()
