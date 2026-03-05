from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Hecho
from .serializers import HechoSerializer


class HechoViewSet(viewsets.ModelViewSet):
    queryset = Hecho.objects.select_related('camera').order_by('-timestamp')
    serializer_class = HechoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'category': ['exact'],
        'is_solved': ['exact'],
        'camera': ['exact'],
        'timestamp': ['gte', 'lte'],
        'coc_intervention': ['exact'],
        'generated_cause': ['exact'],
    }
    search_fields = ['description', 'sector', 'external_ref', 'elements']
    ordering_fields = ['timestamp', 'category', 'is_solved']
    ordering = ['-timestamp']
