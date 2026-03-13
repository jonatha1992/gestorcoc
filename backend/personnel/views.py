from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from .access import PermissionCode
from .models import ExternalPerson, Person
from .permissions import ActionPermissionMixin, HasNamedPermission
from .serializers import ExternalPersonSerializer, PersonSerializer


class PersonViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Person.objects.select_related("unit", "user").prefetch_related("assigned_systems").order_by("last_name", "first_name")
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list": [PermissionCode.VIEW_PERSONNEL],
        "retrieve": [PermissionCode.VIEW_PERSONNEL],
        "create": [PermissionCode.MANAGE_PERSONNEL],
        "update": [PermissionCode.MANAGE_PERSONNEL],
        "partial_update": [PermissionCode.MANAGE_PERSONNEL],
        "destroy": [PermissionCode.MANAGE_PERSONNEL],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "role": ["exact"],
        "is_active": ["exact"],
        "unit": ["exact"],
        "unit__code": ["exact"],
        "guard_group": ["exact", "icontains"],
        "rank": ["exact"],
    }
    search_fields = [
        "first_name",
        "last_name",
        "badge_number",
        "rank",
        "guard_group",
        "unit__name",
        "unit__code",
    ]
    ordering_fields = ["last_name", "first_name", "badge_number", "created_at"]
    ordering = ["last_name", "first_name"]


class ExternalPersonViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = ExternalPerson.objects.all().order_by("last_name", "first_name")
    serializer_class = ExternalPersonSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list": [PermissionCode.VIEW_PERSONNEL],
        "retrieve": [PermissionCode.VIEW_PERSONNEL],
        "create": [PermissionCode.MANAGE_PERSONNEL],
        "update": [PermissionCode.MANAGE_PERSONNEL],
        "partial_update": [PermissionCode.MANAGE_PERSONNEL],
        "destroy": [PermissionCode.MANAGE_PERSONNEL],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "is_active": ["exact"],
        "dni": ["exact"],
    }
    search_fields = ["first_name", "last_name", "dni", "email", "function"]
    ordering_fields = ["last_name", "first_name", "dni", "created_at"]
    ordering = ["last_name", "first_name"]
