# Roles y Permisos - GestorCOC

> **Descripción**: Documentación completa del sistema de roles y permisos del sistema GestorCOC.

## 📋 Resumen Ejecutivo

El sistema utiliza un modelo de **control de acceso basado en roles (RBAC)** con permisos personalizados. Cada usuario tiene un rol que determina sus permisos disponibles.

---

## 🎭 Roles del Sistema

| Rol | Código | Descripción |
|-----|--------|-------------|
| **Administrador** | `ADMIN` | Acceso total al sistema, gestión de usuarios y configuración |
| **Coordinador CREV** | `COORDINADOR_CREV` | Coordina el flujo de verificación CREV |
| **CREV** | `CREV` | Miembro de Control y Verificación (auditoría) |
| **Coordinador COC** | `COORDINADOR_COC` | Opera y gestiona activos y personal del COC |
| **Operador** | `OPERADOR` | Operador estándar (gestiona novedades, hechos, records) |
| **Solo Lectura** | `READ_ONLY` | Visualización sin capacidad de edición |

---

## 🔑 Permisos Disponibles

| Permiso | Código | Descripción |
|---------|--------|-------------|
| `view_dashboard` | `view_dashboard` | Ver panel principal |
| `view_assets` | `view_assets` | Ver activos (vehículos, sistemas) |
| `manage_assets` | `manage_assets` | Crear/editar/eliminar activos |
| `view_personnel` | `view_personnel` | Ver personal |
| `manage_personnel` | `manage_personnel` | Gestionar personal (ABM) |
| `view_novedades` | `view_novedades` | Ver novedades |
| `manage_novedades` | `manage_novedades` | Gestionar novedades |
| `view_hechos` | `view_hechos` | Ver hechos |
| `manage_hechos` | `manage_hechos` | Gestionar hechos |
| `view_records` | `view_records` | Ver registros (partes diarios) |
| `manage_records` | `manage_records` | Gestionar registros **e informes** |
| `use_integrity_tools` | `use_integrity_tools` | Usar herramientas de integridad |
| `verify_crev_record` | `verify_crev_record` | Verificar registros CREV |
| `manage_crev_flow` | `manage_crev_flow` | Gestionar flujo CREV |
| `view_settings` | `view_settings` | Ver configuración |
| `manage_users` | `manage_users` | Gestionar usuarios |

---

## 📊 Matriz de Permisos por Rol

### ✅ = Permitido | ❌ = Denegado

| Permiso | ADMIN | COORD_CREV | CREV | COORD_COC | OPERADOR | READ_ONLY |
|---------|:-----:|:----------:|:----:|:---------:|:--------:|:---------:|
| `view_dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `view_assets` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_assets` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `view_personnel` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_personnel` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `view_novedades` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_novedades` | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `view_hechos` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_hechos` | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `view_records` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_records` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `use_integrity_tools` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `verify_crev_record` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `manage_crev_flow` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `view_settings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_users` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎯 Funcionalidades por Rol

### 👤 ADMIN (Administrador)
- **Acceso completo** a todas las funcionalidades
- Gestión de usuarios (crear, editar, eliminar, resetear contraseñas)
- Configuración del sistema
- Todos los permisos de operación
- Certificación y verificación CREV

### 👥 COORDINADOR CREV
- Todas las funciones de CREV
- **Gestión del flujo de verificación** (aprobar/rechazar verificaciones)
- Supervisión de procesos CREV
- Informes y herramientas de integridad

### 🔍 CREV (Control y Verificación)
- Visualización completa (dashboard, activos, personal)
- **Gestión de registros e informes** (crear/editar)
- **Verificación de registros** (marcar como verificado)
- **Herramientas de integridad** (detectar inconsistencias)
- **Generación de informes** con IA (vinculados a registros)

### 📡 COORDINADOR COC
- Gestión de **activos** (vehículos, sistemas, equipos)
- Gestión de **personal** (altas, bajas, modificaciones)
- Operación de novedades y hechos
- Visualización completa del sistema

### ⚙️ OPERADOR
- Gestión de **novedades** (partes de novedades)
- Gestión de **hechos** (registro de eventos)
- Gestión de **registros e informes** (partes diarios, informes con IA)
- Visualización de activos y personal (solo lectura)

### 👁️ READ_ONLY (Solo Lectura)
- Visualización de dashboard
- Consulta de activos, personal, novedades, hechos y records
- **Sin capacidad de edición o creación**
- Ideal para supervisores que solo necesitan monitorear

---

## 🔧 Implementación Técnica

### Backend (Django)

**Archivo**: `backend/personnel/access.py`

```python
# Definición de permisos custom
class PermissionCode:
    VIEW_DASHBOARD = "view_dashboard"
    MANAGE_ASSETS = "manage_assets"
    # ... etc

# Mapeo de roles a permisos
GROUP_PERMISSION_MAP = {
    "ADMIN": list(CUSTOM_PERMISSION_LABELS.keys()),
    "COORDINADOR_CREV": [...],
    "CREV": [...],
    # ...
}
```

**Middleware de permisos**: `backend/personnel/permissions.py`

```python
class HasNamedPermission(BasePermission):
    """Verifica permisos custom en vistas DRF"""
```

### Frontend (Angular)

**Servicio**: `frontend/src/app/services/auth.service.ts`

```typescript
hasPermission(code: PermissionCode | string): boolean {
  return !!this.userState()?.permission_codes.includes(code);
}

hasAnyPermission(codes: readonly PermissionCode[]): boolean {
  return codes.some((code) => this.hasPermission(code));
}
```

**Guía de rutas**: `frontend/src/app/guards/auth.guard.ts`

```typescript
export const permissionGuard: CanActivateFn = (route) => {
  const requiredPermissions = route.data?.['permissions'] ?? [];
  return authService.hasAnyPermission(requiredPermissions);
};
```

---

## 📝 Uso en Vistas

### Backend Example

```python
from personnel.permissions import ActionPermissionMixin
from personnel.access import PermissionCode

class AssetViewSet(ActionPermissionMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasNamedPermission]
    
    action_permissions = {
        "list": [PermissionCode.VIEW_ASSETS],
        "create": [PermissionCode.MANAGE_ASSETS],
        "update": [PermissionCode.MANAGE_ASSETS],
        "destroy": [PermissionCode.MANAGE_ASSETS],
    }
```

### Frontend Example

```typescript
// En componente
get canManageAssets(): boolean {
  return this.authService.hasPermission(PermissionCodes.MANAGE_ASSETS);
}

// En template HTML
@if (canManageAssets) {
  <button>Edit Asset</button>
}

// En rutas
{
  path: 'assets',
  canActivate: [permissionGuard],
  data: { permissions: [PermissionCodes.VIEW_ASSETS] }
}
```

---

## 🔄 Flujo de Autenticación

1. **Login**: Usuario envía credenciales → `/api/auth/login/`
2. **Response**: JWT tokens + payload de usuario con permisos
   ```json
   {
     "access": "<token>",
     "user": {
       "username": "admin",
       "role": "ADMIN",
       "permission_codes": ["view_dashboard", "manage_assets", ...],
       "must_change_password": false
     }
   }
   ```
3. **Frontend**: Almacena token y permisos en estado
4. **Cada request**: Token en header `Authorization: Bearer <token>`
5. **Backend**: Valida token y verifica permisos en cada vista

---

## 🛡️ Seguridad

- **Superusers**: Tienen todos los permisos automáticamente
- **Password forzado**: Usuarios nuevos deben cambiar contraseña en primer login
- **Audit log**: Todas las acciones autenticadas se registran
- **Token expiration**: Access token (30 min), Refresh token (7 días)

---

## 📖 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `backend/personnel/access.py` | Definición de permisos y roles |
| `backend/personnel/permissions.py` | Clases de permisos DRF |
| `backend/personnel/models.py` | Modelos Person, UserAccountProfile |
| `backend/personnel/views.py` | UserManagementViewSet |
| `frontend/src/app/auth/auth.models.ts` | Tipos y constantes de permisos |
| `frontend/src/app/services/auth.service.ts` | Servicio de autenticación |
| `frontend/src/app/guards/auth.guard.ts` | Guards de rutas |

---

## 🚀 Comandos Útiles

### Resetear contraseñas de usuarios seed
```bash
cd backend
python manage.py seed_system_users --reset-passwords
```

### Verificar usuarios existentes
```bash
cd backend
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.all().values('username', 'is_active', 'groups__name')
```

### Crear usuario admin manualmente
```bash
cd backend
python manage.py createsuperuser
```

---

*Documento generado el 25 de marzo de 2026*
