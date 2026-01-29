from rest_framework import serializers
from .models import Novedad

class NovedadSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)

    class Meta:
        model = Novedad
        fields = '__all__'
