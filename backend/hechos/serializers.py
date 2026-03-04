from rest_framework import serializers
from .models import Hecho
from assets.serializers import CameraSerializer
from personnel.serializers import PersonSerializer
from assets.models import Camera
from personnel.models import Person

class HechoSerializer(serializers.ModelSerializer):
    camera_details = CameraSerializer(source='camera', read_only=True)
    camera_id = serializers.PrimaryKeyRelatedField(
        queryset=Camera.objects.all(), source='camera', write_only=True, required=False, allow_null=True
    )
    
    reported_by_details = PersonSerializer(source='reported_by', read_only=True)
    reported_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.all(), source='reported_by', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Hecho
        fields = [
            'id', 'timestamp', 'description', 
            'camera_details', 'camera_id', 
            'category', 
            'reported_by_details', 'reported_by_id',
            'sector', 'elements', 'intervening_groups',
            'is_solved', 'coc_intervention', 'generated_cause',
            'end_time', 'resolution_time', 'resolution_details',
            'external_ref', 'created_at'
        ]
