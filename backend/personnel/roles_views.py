from rest_framework import permissions, status, views
from rest_framework.response import Response

from .access import (
    CUSTOM_PERMISSION_LABELS,
    GROUP_PERMISSION_MAP,
    ROLE_PRIORITY,
    ensure_role_groups,
    assign_role_group,
)
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from .models import UserAccountProfile


class RolePermissionsView(views.APIView):
    """
    Vista para listar, crear y gestionar roles.
    GET: Lista todos los roles con sus permisos
    POST: Crea un nuevo rol
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if not getattr(user, 'is_superuser', False):
            # Solo admins pueden ver la gestión de roles
            from .access import get_permission_codes
            user_perms = get_permission_codes(user)
            if 'manage_users' not in user_perms:
                return Response(
                    {'detail': 'No tiene permiso para gestionar roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        roles_data = []
        for role_name in ROLE_PRIORITY:
            group = Group.objects.filter(name=role_name).first()
            group_perms = []
            if group:
                group_perms = [
                    perm.codename
                    for perm in group.permissions.all()
                    if perm.codename in CUSTOM_PERMISSION_LABELS.keys()
                ]

            roles_data.append({
                'role': role_name,
                'role_label': self.get_role_label(role_name),
                'permissions': group_perms,
                'all_permissions': list(CUSTOM_PERMISSION_LABELS.keys()),
                'is_system': role_name in ROLE_PRIORITY,  # Indica si es rol del sistema
            })

        return Response(roles_data)

    def post(self, request, *args, **kwargs):
        """
        Crear un nuevo rol personalizado
        Body: {
            'role_name': 'MI_ROL',
            'role_label': 'Mi Rol Personalizado',
            'permissions': ['perm1', 'perm2', ...]
        }
        """
        user = request.user
        if not getattr(user, 'is_superuser', False):
            from .access import get_permission_codes
            user_perms = get_permission_codes(user)
            if 'manage_users' not in user_perms:
                return Response(
                    {'detail': 'No tiene permiso para crear roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        role_name = request.data.get('role_name', '').strip()
        role_label = request.data.get('role_label', '').strip()
        permissions_data = request.data.get('permissions', [])

        # Validaciones
        if not role_name:
            return Response(
                {'detail': 'El nombre del rol es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar formato del nombre (solo mayúsculas, números y guión bajo)
        import re
        if not re.match(r'^[A-Z][A-Z0-9_]*$', role_name):
            return Response(
                {'detail': 'El nombre del rol debe comenzar con mayúscula y contener solo mayúsculas, números y guión bajo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no exista
        if Group.objects.filter(name=role_name).exists():
            return Response(
                {'detail': f'Ya existe un rol con el nombre "{role_name}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no sea un rol reservado
        reserved_names = ['ADMIN', 'COORDINADOR_CREV', 'CREV', 'COORDINADOR_COC', 'OPERADOR', 'READ_ONLY']
        if role_name in reserved_names:
            return Response(
                {'detail': f'El nombre "{role_name}" está reservado para roles del sistema.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar permisos
        valid_perms = set(CUSTOM_PERMISSION_LABELS.keys())
        for perm in permissions_data:
            if perm not in valid_perms:
                return Response(
                    {'detail': f'Permiso "{perm}" no válido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Crear el grupo
        ensure_role_groups()
        group = Group.objects.create(name=role_name)

        # Asignar permisos
        content_type = ContentType.objects.get_for_model(UserAccountProfile)
        perm_objects = Permission.objects.filter(
            content_type=content_type,
            codename__in=permissions_data
        )
        group.permissions.set(perm_objects)
        group.save()

        return Response({
            'message': f'Rol "{role_name}" creado correctamente.',
            'role': role_name,
            'role_label': role_label or role_name,
            'permissions': permissions_data,
        }, status=status.HTTP_201_CREATED)

    def get_role_label(self, role: str) -> str:
        labels = {
            'ADMIN': 'Administrador',
            'COORDINADOR_CREV': 'Coordinador CREV',
            'CREV': 'CREV',
            'COORDINADOR_COC': 'Coordinador COC',
            'OPERADOR': 'Operador',
            'READ_ONLY': 'Solo Lectura',
        }
        return labels.get(role, role)


class DeleteRoleView(views.APIView):
    """
    Vista para eliminar un rol personalizado.
    DELETE: Elimina un rol (solo si no es del sistema)
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, role_name, *args, **kwargs):
        user = request.user
        if not getattr(user, 'is_superuser', False):
            from .access import get_permission_codes
            user_perms = get_permission_codes(user)
            if 'manage_users' not in user_perms:
                return Response(
                    {'detail': 'No tiene permiso para eliminar roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # No permitir eliminar roles del sistema
        if role_name in ROLE_PRIORITY:
            return Response(
                {'detail': f'No se puede eliminar el rol del sistema "{role_name}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group = Group.objects.filter(name=role_name).first()
        if not group:
            return Response(
                {'detail': f'El rol "{role_name}" no existe.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si hay usuarios con este rol
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users_with_role = User.objects.filter(groups=group).count()
        
        if users_with_role > 0:
            return Response(
                {'detail': f'No se puede eliminar el rol porque tiene {users_with_role} usuario(s) asignado(s). Asigne otro rol a estos usuarios primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group.delete()

        return Response({
            'message': f'Rol "{role_name}" eliminado correctamente.',
        })


class UpdateRolePermissionsView(views.APIView):
    """
    Vista para actualizar permisos de un rol específico.
    POST: Actualiza los permisos del rol especificado
    Body: {'permissions': ['perm1', 'perm2', ...]}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, role_name, *args, **kwargs):
        user = request.user
        if not getattr(user, 'is_superuser', False):
            from .access import get_permission_codes
            user_perms = get_permission_codes(user)
            if 'manage_users' not in user_perms:
                return Response(
                    {'detail': 'No tiene permiso para gestionar roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if role_name not in ROLE_PRIORITY:
            return Response(
                {'detail': f'Rol "{role_name}" no válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Admin no puede ser modificado (siempre tiene todos los permisos)
        if role_name == 'ADMIN':
            return Response(
                {'detail': 'El rol ADMIN siempre tiene todos los permisos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        permissions_data = request.data.get('permissions', [])
        
        # Validar permisos
        valid_perms = set(CUSTOM_PERMISSION_LABELS.keys())
        for perm in permissions_data:
            if perm not in valid_perms:
                return Response(
                    {'detail': f'Permiso "{perm}" no válido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Actualizar grupo
        ensure_role_groups()
        group = Group.objects.get(name=role_name)
        
        # Obtener todos los permisos custom
        content_type = ContentType.objects.get_for_model(UserAccountProfile)
        perm_objects = Permission.objects.filter(
            content_type=content_type,
            codename__in=permissions_data
        )
        
        group.permissions.set(perm_objects)
        group.save()

        return Response({
            'message': f'Permisos del rol {role_name} actualizados correctamente.',
            'role': role_name,
            'permissions': permissions_data,
        })
