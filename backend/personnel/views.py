from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Person
from .serializers import PersonSerializer


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.select_related('unit').prefetch_related('assigned_systems').order_by('last_name', 'first_name')
    serializer_class = PersonSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'role': ['exact'],
        'is_active': ['exact'],
        'unit': ['exact'],
        'unit__code': ['exact'],
        'guard_group': ['exact', 'icontains'],
    }
    search_fields = [
        'first_name',
        'last_name',
        'badge_number',
        'rank',
        'guard_group',
        'unit__name',
        'unit__code',
    ]
    ordering_fields = ['last_name', 'first_name', 'badge_number', 'created_at']
    ordering = ['last_name', 'first_name']
