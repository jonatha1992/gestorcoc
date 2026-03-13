from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "created_at",
            "actor",
            "actor_username",
            "username",
            "role",
            "action",
            "method",
            "status_code",
            "path",
            "route_name",
            "ip_address",
            "user_agent",
            "target_app",
            "target_model",
            "target_id",
            "target_repr",
            "message",
            "changes",
            "metadata",
        ]
        read_only_fields = fields
