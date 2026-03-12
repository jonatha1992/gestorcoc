# GestorCOC - Planning y Estado del Proyecto

> Ultima actualizacion: 2026-03-12

---

## Estado General

| Capa | Estado |
| ------ | -------- |
| Backend API (Django + DRF) | Completo y estable |
| Base de datos (PostgreSQL Railway) | Migrada y con datos seed |
| Frontend SPA (Angular 21) | Funcional |
| Autenticacion | Implementada (JWT + login + roles) |
| Deploy (Railway) | Activo |

---

## Modulos - Estado detallado

### Backend

| App | Modelos | API | Filtros/Busqueda | Tests |
| ----- | --------- | ----- | ----------------- | ------- |
| `assets` | OK | OK | OK | Parcial |
| `novedades` | OK | OK | OK | Parcial |
| `hechos` | OK | OK | OK | Parcial |
| `personnel` | OK | OK | OK | OK |
| `records` | OK | OK | OK | OK |
| Dashboard / Map | OK | OK | OK | Parcial |
| IA (Gemini/OpenRouter/Groq) | OK | OK | - | Parcial |

### Frontend

| Ruta | Estado | Observaciones |
| ------ | -------- | --------------- |
| `/login` | OK | Login JWT |
| `/` | OK | Dashboard protegido |
| `/assets` | OK | Acciones filtradas por permisos |
| `/novedades` | OK | Acciones filtradas por permisos |
| `/hechos` | OK | Acciones filtradas por permisos |
| `/personnel` | OK | Roles nuevos y restricciones activas |
| `/records` | OK | Verificacion CREV y permisos |
| `/integrity` | OK | Restringido por permisos |
| `/informes` | OK | Restringido por permisos |
| `/settings` | OK | Perfil autenticado + cambio de contrasena |

---

## Autenticacion y Roles

- Vinculo `Person` <-> `User`: `OneToOneField` nullable en `Person`
- Login: username + password clasico
- Tokens: JWT con refresh token via `djangorestframework-simplejwt`
- Permisos: por grupos/roles y por accion
- Estado actual: endpoints protegidos por defecto, login SPA implementado y control de roles activo

| Rol/Grupo | Alcance base |
| --------- | ------------ |
| `READ_ONLY` | Solo lectura |
| `OPERADOR` | Novedades, hechos y records operativos |
| `COORDINADOR_COC` | Operador + assets y personal |
| `CREV` | Records, integridad, informes, verificacion CREV |
| `COORDINADOR_CREV` | CREV + supervision del flujo CREV |
| `ADMIN` | Acceso total |

| # | Tarea | Estado |
| --- | ------- | --------- |
| 13 | JWT login en SPA | Implementado |
| 14 | Permisos por rol en API | Implementado |
| 15 | Vincular `Person` con `auth.User` | Implementado |
| 16 | Pantalla `/settings` | Implementado |

---

## Infraestructura actual

| Componente | Valor |
| ------------ | ------- |
| Backend hosting | Railway (PostgreSQL + Django) |
| Base de datos | PostgreSQL (Railway) |
| Frontend | Servido por WhiteNoise desde el mismo proceso Django |
| Variables de entorno | `.env` local / Railway env vars en produccion |
| Proveedores IA | Gemini, OpenRouter, Groq, Ollama |
| Usuarios Django | `admin`, `coord_coc_1`, `coord_crev_1`, `crev_1`, `operador_1`, `generico_1` |
