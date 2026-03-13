from rest_framework.permissions import BasePermission

from .access import GroupName, get_permission_codes


class HasNamedPermission(BasePermission):
    message = "No tiene permisos para realizar esta accion."

    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, "is_authenticated", False):
            return False
        if getattr(user, "is_superuser", False):
            return True

        required = []
        if hasattr(view, "get_required_permissions"):
            required = view.get_required_permissions() or []
        elif hasattr(view, "required_permissions"):
            required = getattr(view, "required_permissions") or []

        if not required:
            return True

        codes = set(get_permission_codes(user))
        return all(permission in codes for permission in required)


class ActionPermissionMixin:
    action_permissions = {}

    def get_required_permissions(self):
        return self.action_permissions.get(getattr(self, "action", ""), [])


def is_admin_like(user) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "is_superuser", False):
        return True
    return GroupName.ADMIN in set(user.groups.values_list("name", flat=True))
