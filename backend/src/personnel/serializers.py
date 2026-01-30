from rest_framework import serializers
from .models import Person
from assets.models import System, Unit
from assets.serializers import SystemSerializer

class PersonSerializer(serializers.ModelSerializer):
    assigned_systems_details = SystemSerializer(source='assigned_systems', many=True, read_only=True)
    assigned_systems = serializers.PrimaryKeyRelatedField(queryset=System.objects.all(), many=True, required=False)
    unit = serializers.SlugRelatedField(queryset=Unit.objects.all(), slug_field='code', required=False, allow_null=True)

    class Meta:
        model = Person
        fields = ['id', 'first_name', 'last_name', 'badge_number', 'role', 'rank', 'unit', 'guard_group', 'assigned_systems', 'assigned_systems_details', 'is_active']
