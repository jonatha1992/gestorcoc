from django.contrib.auth.views import LogoutView
from django.urls import path
from django.views.generic import RedirectView

from .views import (
    AppLoginView,
    CatalogCreateView,
    CatalogItemCreateView,
    CatalogItemListView,
    CatalogItemUpdateView,
    CatalogListView,
    CatalogUpdateView,
    CctvSystemCreateView,
    CctvSystemListView,
    CctvSystemUpdateView,
    HomeView,
    OrganizationalGroupCreateView,
    OrganizationalGroupListView,
    OrganizationalGroupUpdateView,
    OrganizationalUnitCreateView,
    OrganizationalUnitListView,
    OrganizationalUnitUpdateView,
    RoleCreateView,
    RoleListView,
    RoleUpdateView,
    UserCreateView,
    UserListView,
    UserUpdateView,
)

app_name = "core"

urlpatterns = [
    path("", RedirectView.as_view(pattern_name="core:home", permanent=False)),
    path("login/", AppLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("home/", HomeView.as_view(), name="home"),
    path("roles/", RoleListView.as_view(), name="role_list"),
    path("roles/nuevo/", RoleCreateView.as_view(), name="role_create"),
    path("roles/<int:pk>/editar/", RoleUpdateView.as_view(), name="role_update"),
    path("catalogos/", CatalogListView.as_view(), name="catalog_list"),
    path("catalogos/nuevo/", CatalogCreateView.as_view(), name="catalog_create"),
    path("catalogos/<int:pk>/editar/", CatalogUpdateView.as_view(), name="catalog_update"),
    path(
        "catalogos/<int:catalog_id>/items/",
        CatalogItemListView.as_view(),
        name="catalog_item_list",
    ),
    path(
        "catalogos/<int:catalog_id>/items/nuevo/",
        CatalogItemCreateView.as_view(),
        name="catalog_item_create",
    ),
    path(
        "catalogos/items/<int:pk>/editar/",
        CatalogItemUpdateView.as_view(),
        name="catalog_item_update",
    ),
    path("organizacion/unidades/", OrganizationalUnitListView.as_view(), name="org_unit_list"),
    path(
        "organizacion/unidades/nueva/",
        OrganizationalUnitCreateView.as_view(),
        name="org_unit_create",
    ),
    path(
        "organizacion/unidades/<int:pk>/editar/",
        OrganizationalUnitUpdateView.as_view(),
        name="org_unit_update",
    ),
    path("organizacion/sistemas/", CctvSystemListView.as_view(), name="cctv_system_list"),
    path(
        "organizacion/sistemas/nuevo/",
        CctvSystemCreateView.as_view(),
        name="cctv_system_create",
    ),
    path(
        "organizacion/sistemas/<int:pk>/editar/",
        CctvSystemUpdateView.as_view(),
        name="cctv_system_update",
    ),
    path("organizacion/grupos/", OrganizationalGroupListView.as_view(), name="org_group_list"),
    path(
        "organizacion/grupos/nuevo/",
        OrganizationalGroupCreateView.as_view(),
        name="org_group_create",
    ),
    path(
        "organizacion/grupos/<int:pk>/editar/",
        OrganizationalGroupUpdateView.as_view(),
        name="org_group_update",
    ),
    path("usuarios/", UserListView.as_view(), name="user_list"),
    path("usuarios/nuevo/", UserCreateView.as_view(), name="user_create"),
    path("usuarios/<int:pk>/editar/", UserUpdateView.as_view(), name="user_update"),
]
