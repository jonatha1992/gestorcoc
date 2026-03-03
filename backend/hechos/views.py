from rest_framework import viewsets
from .models import Hecho
from .serializers import HechoSerializer

class HechoViewSet(viewsets.ModelViewSet):
    queryset = Hecho.objects.all()
    serializer_class = HechoSerializer
    filterset_fields = ['category', 'camera', 'reported_by']
    search_fields = ['description', 'external_ref']
