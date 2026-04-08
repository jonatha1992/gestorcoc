from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from .models import Person, UserAccountProfile


class GroupName:
    READ_ONLY = "READ_ONLY"
    OPERADOR = Person.ROLE_OPERADOR
    COORDINADOR_COC = Person.ROLE_COORDINADOR_COC
    CREV = Person.ROLE_CREV
    COORDINADOR_CREV = Person.ROLE_COORDINADOR_CREV
    ADMIN = Person.ROLE_ADMIN


ROLE_PRIORITY = [
    GroupName.ADMIN,
    GroupName.COORDINADOR_CREV,
    GroupName.CREV,
    GroupName.COORDINADOR_COC,
    GroupName.OPERADOR,
    GroupName.READ_ONLY,
]


class PermissionCode:
    VIEW_DASHBOARD = "view_dashboard"
    VIEW_ASSETS = "view_assets"
    MANAGE_ASSETS = "manage_assets"
    VIEW_PERSONNEL = "view_personnel"
    MANAGE_PERSONNEL = "manage_personnel"
    VIEW_NOVEDADES = "view_novedades"
    MANAGE_NOVEDADES = "manage_novedades"
    VIEW_HECHOS = "view_hechos"
    MANAGE_HECHOS = "manage_hechos"
    VIEW_RECORDS = "view_records"
    MANAGE_RECORDS = "manage_records"
    USE_INTEGRITY = "use_integrity_tools"
    VERIFY_CREV = "verify_crev_record"
    MANAGE_CREV_FLOW = "manage_crev_flow"
    VIEW_SETTINGS = "view_settings"
    MANAGE_USERS = "manage_users"


CUSTOM_PERMISSION_LABELS = {
    PermissionCode.VIEW_DASHBOARD: "Can view dashboard",
    PermissionCode.VIEW_ASSETS: "Can view assets",
    PermissionCode.MANAGE_ASSETS: "Can manage assets",
    PermissionCode.VIEW_PERSONNEL: "Can view personnel",
    PermissionCode.MANAGE_PERSONNEL: "Can manage personnel",
    PermissionCode.VIEW_NOVEDADES: "Can view novedades",
    PermissionCode.MANAGE_NOVEDADES: "Can manage novedades",
    PermissionCode.VIEW_HECHOS: "Can view hechos",
    PermissionCode.MANAGE_HECHOS: "Can manage hechos",
    PermissionCode.VIEW_RECORDS: "Can view records",
    PermissionCode.MANAGE_RECORDS: "Can manage records (includes creating reports)",
    PermissionCode.USE_INTEGRITY: "Can use integrity tools",
    PermissionCode.VERIFY_CREV: "Can verify CREV records",
    PermissionCode.MANAGE_CREV_FLOW: "Can manage CREV flow",
    PermissionCode.VIEW_SETTINGS: "Can view settings",
    PermissionCode.MANAGE_USERS: "Can manage user accounts",
}


GROUP_PERMISSION_MAP = {
    GroupName.READ_ONLY: [
        PermissionCode.VIEW_DASHBOARD,
        PermissionCode.VIEW_ASSETS,
        PermissionCode.VIEW_PERSONNEL,
        PermissionCode.VIEW_NOVEDADES,
        PermissionCode.VIEW_HECHOS,
        PermissionCode.VIEW_RECORDS,
        PermissionCode.VIEW_SETTINGS,
    ],
    GroupName.OPERADOR: [
        PermissionCode.VIEW_DASHBOARD,
        PermissionCode.VIEW_ASSETS,
        PermissionCode.VIEW_PERSONNEL,
        PermissionCode.VIEW_NOVEDADES,
        PermissionCode.MANAGE_NOVEDADES,
        PermissionCode.VIEW_HECHOS,
        PermissionCode.MANAGE_HECHOS,
        PermissionCode.VIEW_RECORDS,
        PermissionCode.MANAGE_RECORDS,
        PermissionCode.VIEW_SETTINGS,
    ],
    GroupName.COORDINADOR_COC: [
        PermissionCode.VIEW_DASHBOARD,
        PermissionCode.VIEW_ASSETS,
        PermissionCode.MANAGE_ASSETS,
        PermissionCode.VIEW_PERSONNEL,
        PermissionCode.MANAGE_PERSONNEL,
        PermissionCode.VIEW_NOVEDADES,
        PermissionCode.MANAGE_NOVEDADES,
        PermissionCode.VIEW_HECHOS,
        PermissionCode.MANAGE_HECHOS,
        PermissionCode.VIEW_RECORDS,
        PermissionCode.MANAGE_RECORDS,
        PermissionCode.VIEW_SETTINGS,
    ],
    GroupName.CREV: [
        PermissionCode.VIEW_DASHBOARD,
        PermissionCode.VIEW_ASSETS,
        PermissionCode.VIEW_PERSONNEL,
        PermissionCode.VIEW_NOVEDADES,
        PermissionCode.VIEW_HECHOS,
        PermissionCode.VIEW_RECORDS,
        PermissionCode.MANAGE_RECORDS,
        PermissionCode.USE_INTEGRITY,
        PermissionCode.VERIFY_CREV,
        PermissionCode.VIEW_SETTINGS,
    ],
    GroupName.COORDINADOR_CREV: [
        PermissionCode.VIEW_DASHBOARD,
        PermissionCode.VIEW_ASSETS,
        PermissionCode.VIEW_PERSONNEL,
        PermissionCode.VIEW_NOVEDADES,
        PermissionCode.VIEW_HECHOS,
        PermissionCode.VIEW_RECORDS,
        PermissionCode.MANAGE_RECORDS,
        PermissionCode.USE_INTEGRITY,
        PermissionCode.VERIFY_CREV,
        PermissionCode.MANAGE_CREV_FLOW,
        PermissionCode.VIEW_SETTINGS,
    ],
    GroupName.ADMIN: list(CUSTOM_PERMISSION_LABELS.keys()),
}


@dataclass(frozen=True)
class AuthUserPayload:
    user_id: int
    username: str
    display_name: str
    initials: str
    role: str | None
    permission_codes: list[str]
    linked_person_id: int | None
    must_change_password: bool


def _content_type():
    return ContentType.objects.get_for_model(UserAccountProfile)


def ensure_custom_permissions():
    content_type = _content_type()
    permissions = {}
    for codename, name in CUSTOM_PERMISSION_LABELS.items():
        permission, _ = Permission.objects.get_or_create(
            content_type=content_type,
            codename=codename,
            defaults={"name": name},
        )
        if permission.name != name:
            permission.name = name
            permission.save(update_fields=["name"])
        permissions[codename] = permission
    return permissions


def ensure_role_groups():
    permissions = ensure_custom_permissions()
    for group_name, permission_codes in GROUP_PERMISSION_MAP.items():
        group, _ = Group.objects.get_or_create(name=group_name)
        group.permissions.set([permissions[code] for code in permission_codes])


def get_user_role(user) -> str | None:
    if not getattr(user, "is_authenticated", False):
        return None
    if getattr(user, "is_superuser", False):
        return GroupName.ADMIN

    group_names = set(user.groups.values_list("name", flat=True))
    for role_name in ROLE_PRIORITY:
        if role_name in group_names:
            return role_name

    person = getattr(user, "person", None)
    if person is not None:
        return person.role
    return None


def get_permission_codes(user) -> list[str]:
    if not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return sorted(CUSTOM_PERMISSION_LABELS.keys())

    prefix = f"{UserAccountProfile._meta.app_label}."
    custom_codes = []
    for perm in user.get_all_permissions():
        if perm.startswith(prefix):
            custom_codes.append(perm[len(prefix):])
    return sorted(set(custom_codes))


def assign_role_group(user, role_name: str):
    ensure_role_groups()
    groups = Group.objects.filter(name__in=ROLE_PRIORITY)
    user.groups.remove(*groups)
    if role_name:
        user.groups.add(Group.objects.get(name=role_name))


def build_auth_user_payload(user) -> dict:
    person = getattr(user, "person", None)
    profile = getattr(user, "account_profile", None)
    role = get_user_role(user)
    display_name = (
        f"{person.first_name} {person.last_name}".strip()
        if person is not None
        else f"{user.first_name} {user.last_name}".strip()
    ) or user.username
    initials_source = display_name.split()
    initials = "".join(part[0] for part in initials_source[:2]).upper() or user.username[:2].upper()
    payload = AuthUserPayload(
        user_id=user.id,
        username=user.username,
        display_name=display_name,
        initials=initials,
        role=role,
        permission_codes=get_permission_codes(user),
        linked_person_id=person.id if person is not None else None,
        # Los superusers (ej. admin) son la excepción: nunca se les fuerza el cambio de contraseña
        must_change_password=False if getattr(user, "is_superuser", False) else (
            bool(profile.must_change_password) if profile is not None else False
        ),
    )
    return payload.__dict__
