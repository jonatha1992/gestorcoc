from django.utils import timezone
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

    def validate(self, attrs):
        timestamp = attrs.get('timestamp', getattr(self.instance, 'timestamp', None) if self.instance else None)
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None) if self.instance else None)
        now = timezone.now()
        errors = {}

        for field_name, value in {'timestamp': timestamp, 'end_time': end_time}.items():
            if value is None:
                continue
            current_value = value
            if timezone.is_naive(current_value):
                current_value = timezone.make_aware(current_value, timezone.get_current_timezone())
            if current_value > now:
                errors[field_name] = 'No puede ser una fecha y hora futura.'

        if timestamp and end_time:
            start_value = timestamp
            finish_value = end_time
            if timezone.is_naive(start_value):
                start_value = timezone.make_aware(start_value, timezone.get_current_timezone())
            if timezone.is_naive(finish_value):
                finish_value = timezone.make_aware(finish_value, timezone.get_current_timezone())
            if finish_value < start_value:
                errors['end_time'] = 'La hora de finalizacion no puede ser anterior al inicio.'

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
