from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    date_hierarchy = "created_at"
    list_display = (
        "created_at",
        "action",
        "username",
        "status_code",
        "target_model",
        "target_id",
        "message",
    )
    list_filter = ("action", "status_code", "target_app", "target_model", "role", "method")
    search_fields = ("username", "path", "route_name", "target_repr", "message", "target_id")
    readonly_fields = (
        "created_at",
        "updated_at",
        "actor",
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
    )
    ordering = ("-created_at", "-id")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
