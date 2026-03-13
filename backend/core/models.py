from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(TimeStampedModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    username = models.CharField(max_length=150, blank=True, db_index=True)
    role = models.CharField(max_length=64, blank=True, db_index=True)
    action = models.CharField(max_length=80, db_index=True)
    method = models.CharField(max_length=10, blank=True, db_index=True)
    status_code = models.PositiveSmallIntegerField(default=200, db_index=True)
    path = models.CharField(max_length=255, blank=True)
    route_name = models.CharField(max_length=255, blank=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    target_app = models.CharField(max_length=100, blank=True, db_index=True)
    target_model = models.CharField(max_length=100, blank=True, db_index=True)
    target_id = models.CharField(max_length=64, blank=True, db_index=True)
    target_repr = models.CharField(max_length=255, blank=True)
    message = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Registro de auditoria"
        verbose_name_plural = "Registros de auditoria"

    def __str__(self):
        target = self.target_repr or self.target_model or self.path or "sin destino"
        actor = self.username or "anonimo"
        return f"{self.action} | {actor} | {target}"
