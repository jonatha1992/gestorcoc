from rest_framework import serializers

from assets.models import System, Unit

from .models import ExternalPerson, Person, UserAccountProfile


class PersonSerializer(serializers.ModelSerializer):
    assigned_systems_details = serializers.SerializerMethodField()
    assigned_systems = serializers.PrimaryKeyRelatedField(queryset=System.objects.all(), many=True, required=False)
    unit = serializers.SlugRelatedField(queryset=Unit.objects.all(), slug_field="code", required=False, allow_null=True)
    rank_display = serializers.CharField(source="get_rank_display", read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    has_account = serializers.SerializerMethodField()

    def get_assigned_systems_details(self, obj):
        return [
            {
                "id": system.id,
                "name": system.name,
                "unit_code": system.unit.code if system.unit else "",
                "unit_name": system.unit.name if system.unit else "",
                "system_type": system.system_type,
                "is_active": system.is_active,
            }
            for system in obj.assigned_systems.all()
        ]

    def get_has_account(self, obj):
        return obj.user_id is not None

    class Meta:
        model = Person
        fields = [
            "id",
            "first_name",
            "last_name",
            "badge_number",
            "role",
            "role_display",
            "rank",
            "rank_display",
            "unit",
            "guard_group",
            "assigned_systems",
            "assigned_systems_details",
            "user_id",
            "username",
            "has_account",
            "is_active",
        ]

    def validate_badge_number(self, value):
        normalized = "".join(ch for ch in str(value) if ch.isdigit())
        if len(normalized) != 6:
            raise serializers.ValidationError("El legajo debe contener exactamente 6 digitos.")
        return normalized


class ExternalPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalPerson
        fields = ["id", "first_name", "last_name", "dni", "email", "function", "is_active"]

    def validate_dni(self, value):
        normalized = "".join(ch for ch in str(value) if ch.isdigit())
        if len(normalized) < 7 or len(normalized) > 10:
            raise serializers.ValidationError("El DNI debe contener solo numeros (entre 7 y 10 digitos).")
        return normalized


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer de solo lectura para la vista de gestión de cuentas de usuario."""
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    last_login = serializers.DateTimeField(source="user.last_login", read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    unit = serializers.SlugRelatedField(
        queryset=Unit.objects.all(), slug_field="code", required=False, allow_null=True
    )
    unit_name = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()
    has_account = serializers.SerializerMethodField()

    def get_unit_name(self, obj):
        return obj.unit.name if obj.unit else None

    def get_must_change_password(self, obj):
        profile = getattr(obj.user, "account_profile", None) if obj.user else None
        return bool(profile.must_change_password) if profile else False

    def get_has_account(self, obj):
        return obj.user_id is not None

    class Meta:
        model = Person
        fields = [
            "id",
            "username",
            "user_id",
            "first_name",
            "last_name",
            "badge_number",
            "role",
            "role_display",
            "rank",
            "unit",
            "unit_name",
            "is_active",
            "user_is_active",
            "must_change_password",
            "last_login",
            "has_account",
        ]
