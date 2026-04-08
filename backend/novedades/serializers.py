from rest_framework import serializers
from .models import Novedad

class NovedadSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    server_name = serializers.CharField(source='server.name', read_only=True)
    system_name = serializers.CharField(source='system.name', read_only=True)
    cameraman_gear_name = serializers.CharField(source='cameraman_gear.name', read_only=True)
    reported_by_name = serializers.SerializerMethodField(read_only=True)

    def get_reported_by_name(self, obj):
        if obj.reported_by:
            return f"{obj.reported_by.last_name}, {obj.reported_by.first_name}"
        return obj.reporter_name or ''

    class Meta:
        model = Novedad
        fields = '__all__'
        extra_kwargs = {
            'coc_ticket_number': {
                'required': False,
                'allow_blank': True,
                'allow_null': True
            }
        }
