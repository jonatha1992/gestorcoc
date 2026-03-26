from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status as drf_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assets.models import Unit
from .access import PermissionCode, assign_role_group
from .models import ExternalPerson, Person, UserAccountProfile
from .permissions import ActionPermissionMixin, HasNamedPermission
from .serializers import ExternalPersonSerializer, PersonSerializer, UserManagementSerializer

User = get_user_model()


class PersonViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = Person.objects.select_related("unit", "user").prefetch_related("assigned_systems").order_by("last_name", "first_name")
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list": [PermissionCode.VIEW_PERSONNEL],
        "retrieve": [PermissionCode.VIEW_PERSONNEL],
        "create": [PermissionCode.MANAGE_PERSONNEL],
        "update": [PermissionCode.MANAGE_PERSONNEL],
        "partial_update": [PermissionCode.MANAGE_PERSONNEL],
        "destroy": [PermissionCode.MANAGE_PERSONNEL],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "role": ["exact"],
        "is_active": ["exact"],
        "unit": ["exact"],
        "unit__code": ["exact"],
        "guard_group": ["exact", "icontains"],
        "rank": ["exact"],
    }
    search_fields = [
        "first_name",
        "last_name",
        "badge_number",
        "rank",
        "guard_group",
        "unit__name",
        "unit__code",
    ]
    ordering_fields = ["last_name", "first_name", "badge_number", "created_at"]
    ordering = ["last_name", "first_name"]


class ExternalPersonViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    queryset = ExternalPerson.objects.all().order_by("last_name", "first_name")
    serializer_class = ExternalPersonSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list": [PermissionCode.VIEW_PERSONNEL],
        "retrieve": [PermissionCode.VIEW_PERSONNEL],
        "create": [PermissionCode.MANAGE_PERSONNEL],
        "update": [PermissionCode.MANAGE_PERSONNEL],
        "partial_update": [PermissionCode.MANAGE_PERSONNEL],
        "destroy": [PermissionCode.MANAGE_PERSONNEL],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "is_active": ["exact"],
        "dni": ["exact"],
    }
    search_fields = ["first_name", "last_name", "dni", "email", "function"]
    ordering_fields = ["last_name", "first_name", "dni", "created_at"]
    ordering = ["last_name", "first_name"]


class UserManagementViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    """
    Admin-only viewset para gestionar cuentas de usuario del sistema.
    Expone Person + auth.User + UserAccountProfile como un único recurso.
    """
    queryset = (
        Person.objects
        .select_related("unit", "user", "user__account_profile")
        .filter(user__isnull=False)
        .order_by("last_name", "first_name")
    )
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, HasNamedPermission]
    action_permissions = {
        "list":           [PermissionCode.MANAGE_USERS],
        "retrieve":       [PermissionCode.MANAGE_USERS],
        "create":         [PermissionCode.MANAGE_USERS],
        "update":         [PermissionCode.MANAGE_USERS],
        "partial_update": [PermissionCode.MANAGE_USERS],
        "destroy":        [PermissionCode.MANAGE_USERS],
        "toggle_active":  [PermissionCode.MANAGE_USERS],
        "reset_password": [PermissionCode.MANAGE_USERS],
        "force_password_change": [PermissionCode.MANAGE_USERS],
        "clear_password_change": [PermissionCode.MANAGE_USERS],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "role": ["exact"],
        "is_active": ["exact"],
        "unit__code": ["exact"],
    }
    search_fields = ["first_name", "last_name", "badge_number", "user__username"]
    ordering_fields = ["last_name", "first_name", "user__last_login"]
    ordering = ["last_name", "first_name"]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        person_id = data.get("person_id")

        if person_id:
            person = get_object_or_404(Person, pk=person_id, user__isnull=True)
        else:
            badge = "".join(ch for ch in str(data.get("badge_number", "")) if ch.isdigit())
            person = Person(
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
                badge_number=badge,
                role=data.get("role", Person.ROLE_OPERADOR),
                rank=data.get("rank", "CIVIL"),
                guard_group=data.get("guard_group", ""),
            )

        unit_code = data.get("unit")
        if unit_code:
            person.unit = get_object_or_404(Unit, code=unit_code)

        if not person_id:
            person.role = data.get("role", Person.ROLE_OPERADOR)

        username = data.get("username", "").strip()
        password = data.get("password", "")
        if not username:
            return Response({"username": ["El nombre de usuario es requerido."]}, status=drf_status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 6:
            return Response({"password": ["La contraseña debe tener al menos 6 caracteres."]}, status=drf_status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"username": ["Ya existe un usuario con ese nombre."]}, status=drf_status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            password=password,
            is_active=bool(data.get("user_is_active", True)),
        )
        assign_role_group(user, person.role)
        person.user = user
        person.save()
        profile, _ = UserAccountProfile.objects.get_or_create(user=user)
        profile.must_change_password = True
        profile.save(update_fields=["must_change_password"])

        serializer = self.get_serializer(person)
        return Response(serializer.data, status=drf_status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        person = self.get_object()
        user = person.user
        data = request.data

        for field in ("first_name", "last_name", "badge_number", "rank", "guard_group"):
            if field in data:
                value = data[field]
                if field == "badge_number":
                    value = "".join(ch for ch in str(value) if ch.isdigit())
                setattr(person, field, value)

        if "role" in data and data["role"] != person.role:
            person.role = data["role"]
            assign_role_group(user, person.role)

        if "unit" in data:
            unit_code = data["unit"]
            person.unit = get_object_or_404(Unit, code=unit_code) if unit_code else None

        if "is_active" in data:
            person.is_active = bool(data["is_active"])

        person.save()

        if "user_is_active" in data:
            user.is_active = bool(data["user_is_active"])
            user.save(update_fields=["is_active"])

        if data.get("password"):
            if len(data["password"]) < 6:
                return Response({"password": ["La contraseña debe tener al menos 6 caracteres."]}, status=drf_status.HTTP_400_BAD_REQUEST)
            user.set_password(data["password"])
            user.save(update_fields=["password"])
            profile, _ = UserAccountProfile.objects.get_or_create(user=user)
            profile.must_change_password = True
            profile.save(update_fields=["must_change_password"])

        serializer = self.get_serializer(person)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        person = self.get_object()
        person.is_active = False
        person.save(update_fields=["is_active"])
        if person.user:
            person.user.is_active = False
            person.user.save(update_fields=["is_active"])
        return Response(status=drf_status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="toggle_active")
    @transaction.atomic
    def toggle_active(self, request, pk=None):
        person = self.get_object()
        new_state = not person.is_active
        person.is_active = new_state
        person.save(update_fields=["is_active"])
        if person.user:
            person.user.is_active = new_state
            person.user.save(update_fields=["is_active"])
        return Response({"is_active": new_state, "user_is_active": new_state})

    @action(detail=True, methods=["post"], url_path="reset_password")
    @transaction.atomic
    def reset_password(self, request, pk=None):
        person = self.get_object()
        password = request.data.get("password", "")
        if not password or len(password) < 6:
            return Response({"error": "La contraseña debe tener al menos 6 caracteres."}, status=drf_status.HTTP_400_BAD_REQUEST)
        person.user.set_password(password)
        person.user.save(update_fields=["password"])
        profile, _ = UserAccountProfile.objects.get_or_create(user=person.user)
        profile.must_change_password = True
        profile.save(update_fields=["must_change_password"])
        return Response({"message": "Contraseña restablecida. El usuario deberá cambiarla al iniciar sesión."})

    @action(detail=True, methods=["post"], url_path="force_password_change")
    @transaction.atomic
    def force_password_change(self, request, pk=None):
        """
        Fuerza al usuario a cambiar su contraseña en el próximo login.
        Similar a 'Force password change at next logon' de Active Directory.
        """
        person = self.get_object()
        if not person.user:
            return Response({"error": "El usuario no tiene cuenta de sistema."}, status=drf_status.HTTP_400_BAD_REQUEST)
        
        profile, _ = UserAccountProfile.objects.get_or_create(user=person.user)
        profile.must_change_password = True
        profile.save(update_fields=["must_change_password"])
        
        return Response({
            "message": f"Se ha forzado el cambio de contraseña para {person.user.username}. Deberá cambiarla en su próximo inicio de sesión."
        })

    @action(detail=True, methods=["post"], url_path="clear_password_change")
    @transaction.atomic
    def clear_password_change(self, request, pk=None):
        """
        Marca la contraseña como permanente (no requiere cambio).
        Útil cuando el admin cambia la contraseña pero no quiere forzar el cambio.
        """
        person = self.get_object()
        if not person.user:
            return Response({"error": "El usuario no tiene cuenta de sistema."}, status=drf_status.HTTP_400_BAD_REQUEST)
        
        profile, _ = UserAccountProfile.objects.get_or_create(user=person.user)
        profile.must_change_password = False
        profile.save(update_fields=["must_change_password"])
        
        return Response({
            "message": f"La contraseña de {person.user.username} ha sido marcada como permanente."
        })
