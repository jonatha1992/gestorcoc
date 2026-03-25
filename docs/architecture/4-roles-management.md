# Gestión de Roles y Permisos

> **Descripción**: Administración visual de roles y permisos del sistema GestorCOC, similar a Active Directory.

## 📋 Resumen

El sistema ahora permite al administrador:
1. **Ver todos los roles** del sistema
2. **Ver permisos** de cada rol
3. **Editar permisos** de cada rol (activar/desactivar)
4. **Guardar cambios** que se aplican inmediatamente

---

## 🎯 Nueva Funcionalidad

### Ubicación
```
Usuarios (menú lateral)
├── 👥 Lista de Usuarios
└── 🔐 Roles y Permisos ← NUEVO
```

### ¿Qué se puede hacer?

#### 1. Ver Roles Disponibles
- Lista de todos los roles del sistema
- Badge con cantidad de permisos por rol
- Colores distintivos por rol

#### 2. Editar Permisos por Rol
- Checkboxes para activar/desactivar permisos
- Permisos agrupados por categoría:
  - **Dashboard**: Ver panel principal
  - **Activos**: Ver y gestionar activos
  - **Personal**: Ver y gestionar personal
  - **Novedades**: Ver y gestionar novedades
  - **Hechos**: Ver y gestionar hechos
  - **Registros**: Ver y gestionar registros e informes
  - **Integridad**: Herramientas de integridad
  - **CREV**: Verificación y flujo CREV
  - **Sistema**: Configuración
  - **Usuarios**: Gestión de usuarios

#### 3. Guardar Cambios
- Botón "Guardar Cambios" aplica modificaciones
- Cambios se aplican inmediatamente a todos los usuarios con ese rol
- Mensaje de confirmación/toast

---

## 🔧 Implementación Técnica

### Backend (Django)

**Nuevos Endpoints**:

```python
# Listar roles y permisos
GET /api/roles/
# Response: [
#   {
#     "role": "OPERADOR",
#     "role_label": "Operador",
#     "permissions": ["view_dashboard", "manage_novedades", ...],
#     "all_permissions": [...]
#   },
#   ...
# ]

# Actualizar permisos de un rol
POST /api/roles/{role_name}/permissions/
# Body: {"permissions": ["perm1", "perm2", ...]}
# Response: {"message": "...", "role": "...", "permissions": [...]}
```

**Archivos**:
- `backend/personnel/roles_views.py`: Vistas de gestión de roles
- `backend/personnel/urls.py`: URLs actualizadas

### Frontend (Angular)

**Componentes Nuevos**:
- `RolesPermisosComponent`: Componente principal
- `RolePermissionsService`: Servicio para comunicación con API

**Rutas**:
```typescript
{
  path: 'usuarios/roles',
  component: RolesPermisosComponent,
  canActivate: [authGuard, permissionGuard],
  data: { permissions: [PermissionCodes.MANAGE_USERS] }
}
```

---

## 📊 Roles del Sistema

| Rol | Código | Permisos Típicos |
|-----|--------|------------------|
| **Administrador** | `ADMIN` | Todos los permisos (no editable) |
| **Coordinador CREV** | `COORDINADOR_CREV` | Gestión CREV + informes + integridad |
| **CREV** | `CREV` | Verificación + informes + integridad |
| **Coordinador COC** | `COORDINADOR_COC` | Gestión activos + personal + operación |
| **Operador** | `OPERADOR` | Operación: novedades, hechos, registros |
| **Solo Lectura** | `READ_ONLY` | Solo visualización |

---

## 🔐 Permisos Disponibles (17 total)

### Dashboard
- `view_dashboard` - Ver panel principal

### Activos
- `view_assets` - Ver activos (vehículos, sistemas)
- `manage_assets` - Crear/editar/eliminar activos

### Personal
- `view_personnel` - Ver personal
- `manage_personnel` - Gestionar personal (ABM)

### Novedades
- `view_novedades` - Ver novedades
- `manage_novedades` - Gestionar novedades

### Hechos
- `view_hechos` - Ver hechos
- `manage_hechos` - Gestionar hechos

### Registros
- `view_records` - Ver registros
- `manage_records` - Gestionar registros e informes

### Integridad
- `use_integrity_tools` - Usar herramientas de integridad

### CREV
- `verify_crev_record` - Verificar registros CREV
- `manage_crev_flow` - Gestionar flujo CREV

### Sistema
- `view_settings` - Ver configuración

### Usuarios
- `manage_users` - Gestionar usuarios y roles

---

## 🎨 Interfaz de Usuario

### Panel Izquierdo: Lista de Roles
```
┌─────────────────────────────────┐
│ AS Administrador                │
│    ADMIN                        │
│                    17 permisos ▶│
├─────────────────────────────────┤
│ CC Coordinador CREV             │
│    COORDINADOR_CREV             │
│                    12 permisos ▶│
├─────────────────────────────────┤
│ CR CREV                         │
│    CREV                         │
│                    11 permisos ▶│
└─────────────────────────────────┘
```

### Panel Derecho: Editor de Permisos
```
┌───────────────────────────────────────────────┐
│ Coordinador CREV [COORDINADOR_CREV]           │
│ 12 de 17 permisos activados    [GUARDAR]      │
├───────────────────────────────────────────────┤
│ ▼ Dashboard [1 activos]                       │
│   ☑ Ver Dashboard                             │
├───────────────────────────────────────────────┤
│ ▼ Activos [0 activos]                         │
│   ☐ Ver Activos                               │
│   ☐ Gestionar Activos                         │
├───────────────────────────────────────────────┤
│ ▼ CREV [2 activos]                            │
│   ☑ Verificar CREV                            │
│   ☑ Gestionar Flujo CREV                      │
└───────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Uso

### Paso 1: Navegar a Roles y Permisos
```
1. Admin va al menú lateral
2. Click en "Usuarios" → "Roles y Permisos"
```

### Paso 2: Seleccionar Rol
```
1. Click en un rol de la lista izquierda
2. Se cargan los permisos del rol
```

### Paso 3: Editar Permisos
```
1. Expandir categorías con click
2. Activar/desactivar checkboxes
3. Contador muestra permisos activos por categoría
```

### Paso 4: Guardar Cambios
```
1. Click en "Guardar Cambios"
2. Toast de confirmación aparece
3. Cambios aplicados inmediatamente
```

---

## ⚠️ Consideraciones Importantes

### 1. Rol ADMIN
- **No puede ser modificado**
- Siempre tiene todos los permisos
- Es el rol con mayor privilegio

### 2. Impacto de Cambios
- Los cambios se aplican **inmediatamente**
- Afectan a **todos los usuarios** con ese rol
- No requiere logout/login de usuarios

### 3. Permisos Mínimos Recomendados

#### OPERADOR (mínimo para operar):
```
- view_dashboard
- view_assets
- view_personnel
- view_novedades, manage_novedades
- view_hechos, manage_hechos
- view_records, manage_records
```

#### CREV (mínimo para verificar):
```
- view_dashboard
- view_assets
- view_personnel
- view_records, manage_records
- use_integrity_tools
- verify_crev_record
```

---

## 🛡️ Seguridad

### Permisos Requeridos
- Solo usuarios con `manage_users` pueden acceder
- Típicamente solo rol `ADMIN`

### Auditoría
- Todos los cambios quedan registrados
- Backend valida permisos antes de guardar
- Solo superusers pueden modificar ADMIN

### Validaciones
- Permisos inválidos son rechazados
- Rol ADMIN no puede ser modificado
- Nombre de rol debe existir

---

## 🚀 Comandos Útiles

### Ver permisos de un rol (Django Shell)
```bash
cd backend
python manage.py shell
```

```python
from django.contrib.auth.models import Group

# Ver permisos de un rol
group = Group.objects.get(name='OPERADOR')
for perm in group.permissions.all():
    print(f"{perm.codename}: {perm.name}")
```

### Resetear permisos a default
```python
from personnel.access import ensure_role_groups

# Recrea grupos con permisos default
ensure_role_groups()
```

---

## 📝 Ejemplos de Uso

### Escenario 1: Agregar permiso a OPERADOR
```
1. Admin va a "Roles y Permisos"
2. Click en "OPERADOR"
3. Expandir categoría "Activos"
4. Activar "Ver Activos"
5. Click "Guardar Cambios"
6. ✅ Todos los operadores ahora pueden ver activos
```

### Escenario 2: Crear rol personalizado
```
Nota: El sistema no permite crear roles nuevos dinámicamente.
Para crear un rol personalizado:

1. Copiar permisos de rol existente
2. Modificar en backend (access.py)
3. Ejecutar migrate para crear grupo
4. Asignar usuarios al nuevo rol
```

### Escenario 3: Restringir permiso de CREV
```
1. Admin va a "Roles y Permisos"
2. Click en "CREV"
3. Desactivar "Gestionar Flujo CREV"
4. Click "Guardar Cambios"
5. ✅ CREV solo puede verificar, no gestionar flujo
```

---

## 🔍 Troubleshooting

### Los cambios no se aplican
**Causa**: Error de permisos en backend

**Solución**:
1. Verificar que usuario tenga `manage_users`
2. Revisar logs del backend
3. Verificar conexión con base de datos

### Rol no aparece en la lista
**Causa**: Grupo no existe en Django

**Solución**:
```bash
cd backend
python manage.py shell
>>> from personnel.access import ensure_role_groups
>>> ensure_role_groups()
```

### Permiso no funciona después de activar
**Causa**: Cache de permisos en frontend

**Solución**:
1. Usuario debe hacer logout
2. Volver a login
3. Verificar en `/api/auth/me/` que el permiso está presente

---

## 📖 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `backend/personnel/roles_views.py` | Vistas API de roles |
| `backend/personnel/urls.py` | URLs de gestión de roles |
| `backend/personnel/access.py` | Definición de permisos y roles |
| `frontend/src/app/pages/usuarios/roles-permisos.ts` | Componente Angular |
| `frontend/src/app/services/role-permissions.service.ts` | Servicio Angular |

---

*Documento creado el 25 de marzo de 2026*
