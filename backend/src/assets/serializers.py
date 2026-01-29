from rest_framework import serializers
from .models import System, Camera

class SystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = System
        fields = '__all__'

class CameraSerializer(serializers.ModelSerializer):
    system_name = serializers.CharField(source='system.name', read_only=True)

    class Meta:
        model = Camera
        fields = '__all__'
