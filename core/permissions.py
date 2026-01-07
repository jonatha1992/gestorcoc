from functools import wraps
from typing import Iterable

from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect


def user_has_permission(user, module: str, action: str) -> bool:
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    for role in user.roles.all():
        permissions = role.permissions or []
        for perm in permissions:
            if perm.get("module") == module and action in perm.get("actions", []):
                return True
    return False


def permission_required(module: str, action: str, redirect_to: str = "/login/"):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request: HttpRequest, *args, **kwargs) -> HttpResponse:
            if user_has_permission(request.user, module, action):
                return view_func(request, *args, **kwargs)
            return redirect(redirect_to)

        return wrapper

    return decorator


class ModulePermissionRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    module: str = ""
    action: str = "read"

    def test_func(self) -> bool:
        return user_has_permission(self.request.user, self.module, self.action)

    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            return super().handle_no_permission()
        return redirect("core:home")


def roles_for_user(user) -> Iterable[str]:
    if not user.is_authenticated:
        return []
    if user.is_superuser:
        return ["admin"]
    return list(user.roles.values_list("name", flat=True))
