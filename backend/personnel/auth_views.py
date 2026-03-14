from rest_framework import permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.audit import set_audit_context
from .access import build_auth_user_payload
from .auth_serializers import ChangePasswordSerializer, GestorTokenObtainPairSerializer
from .models import UserAccountProfile


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = GestorTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        username = (request.data or {}).get("username", "")
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            set_audit_context(
                request,
                action="login",
                username=username,
                message="Intento de login fallido",
            )
            raise

        set_audit_context(
            request,
            action="login",
            actor=serializer.user,
            username=serializer.user.username,
            message="Login exitoso",
        )
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        set_audit_context(request, action="refresh_token", message="Refresh de token solicitado")
        return super().post(request, *args, **kwargs)


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        UserAccountProfile.objects.get_or_create(user=request.user)
        return Response(build_auth_user_payload(request.user), status=status.HTTP_200_OK)


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        profile, _ = UserAccountProfile.objects.get_or_create(user=user)
        if profile.must_change_password:
            profile.must_change_password = False
            profile.save(update_fields=["must_change_password"])

        set_audit_context(
            request,
            action="change_password",
            actor=user,
            username=user.username,
            message="Contrasena actualizada",
        )

        return Response(
            {
                "message": "Contrasena actualizada correctamente.",
                "user": build_auth_user_payload(user),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        set_audit_context(
            request,
            action="logout",
            actor=request.user,
            username=request.user.username,
            message="Cierre de sesion",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
