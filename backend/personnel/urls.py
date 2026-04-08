from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .roles_views import RolePermissionsView, UpdateRolePermissionsView, DeleteRoleView

router = DefaultRouter()
router.register(r"people", views.PersonViewSet)
router.register(r"external-people", views.ExternalPersonViewSet)
router.register(r"users", views.UserManagementViewSet, basename="user-management")

app_name = "personnel"

urlpatterns = [
    path("", include(router.urls)),
    path("roles/", RolePermissionsView.as_view(), name="role-permissions"),
    path("roles/<str:role_name>/permissions/", UpdateRolePermissionsView.as_view(), name="update-role-permissions"),
    path("roles/<str:role_name>/delete/", DeleteRoleView.as_view(), name="delete-role"),
]
