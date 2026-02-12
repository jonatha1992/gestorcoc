from rest_framework import serializers
from .models import Novedad

class NovedadSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
<<<<<<< HEAD
=======
    server_name = serializers.CharField(source='server.name', read_only=True)
    system_name = serializers.CharField(source='system.name', read_only=True)
    cameraman_gear_name = serializers.CharField(source='cameraman_gear.name', read_only=True)
>>>>>>> dev

    class Meta:
        model = Novedad
        fields = '__all__'
