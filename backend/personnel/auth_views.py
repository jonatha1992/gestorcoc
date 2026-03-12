from rest_framework import permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .access import build_auth_user_payload
from .auth_serializers import ChangePasswordSerializer, GestorTokenObtainPairSerializer
from .models import UserAccountProfile


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = GestorTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


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
        return Response(status=status.HTTP_204_NO_CONTENT)
