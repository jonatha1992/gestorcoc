from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"people", views.PersonViewSet)
router.register(r"external-people", views.ExternalPersonViewSet)
router.register(r"users", views.UserManagementViewSet, basename="user-management")

app_name = "personnel"

urlpatterns = [
    path("", include(router.urls)),
]
