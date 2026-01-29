from rest_framework import serializers
from .models import FilmRecord, Catalog
from assets.models import Camera
from personnel.models import Person

class FilmRecordSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    operator_name = serializers.CharField(source='operator.last_name', read_only=True)
    
    class Meta:
        model = FilmRecord
        fields = '__all__'

class CatalogSerializer(serializers.ModelSerializer):
    records_count = serializers.IntegerField(source='records.count', read_only=True)
    
    class Meta:
        model = Catalog
        fields = '__all__'
