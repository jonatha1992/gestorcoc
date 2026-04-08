from django.contrib.auth import password_validation
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .access import build_auth_user_payload
from .models import UserAccountProfile


class GestorTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        UserAccountProfile.objects.get_or_create(user=self.user)
        data["user"] = build_auth_user_payload(self.user)
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False)
    new_password_confirm = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "La nueva contraseña y su confirmación no coinciden."}
            )
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "La contraseña actual es incorrecta."})
        password_validation.validate_password(attrs["new_password"], user=user)
        return attrs
