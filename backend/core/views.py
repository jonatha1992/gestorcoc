from rest_framework import permissions, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from personnel.permissions import is_admin_like

from .models import AuditLog
from .serializers import AuditLogSerializer


class IsAuditLogReader(permissions.BasePermission):
    message = "Solo administradores pueden consultar la auditoria."

    def has_permission(self, request, view):
        return is_admin_like(request.user)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditLogReader]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "action": ["exact"],
        "method": ["exact"],
        "status_code": ["exact", "gte", "lte"],
        "username": ["exact", "icontains"],
        "role": ["exact"],
        "target_app": ["exact"],
        "target_model": ["exact"],
        "target_id": ["exact"],
        "created_at": ["gte", "lte"],
    }
    search_fields = [
        "username",
        "path",
        "route_name",
        "target_repr",
        "message",
        "target_model",
        "target_id",
    ]
    ordering_fields = ["created_at", "status_code", "action", "target_model", "username"]
    ordering = ["-created_at"]
