# GestorCOC — Documentación General del Sistema

> **Versión**: 1.0 | **Fecha**: Marzo 2026 | **Estado**: Producción Activa

---

## Tabla de Contenidos

1. [Descripción del Sistema](#1-descripción-del-sistema)
2. [Arquitectura General](#2-arquitectura-general)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Infraestructura y Despliegue](#4-infraestructura-y-despliegue)
5. [Módulos del Backend](#5-módulos-del-backend)
6. [Módulos del Frontend](#6-módulos-del-frontend)
7. [Modelo de Datos](#7-modelo-de-datos)
8. [Roles y Permisos (RBAC)](#8-roles-y-permisos-rbac)
9. [Autenticación y Seguridad](#9-autenticación-y-seguridad)
10. [Inteligencia Artificial](#10-inteligencia-artificial)
11. [Requisitos Funcionales](#11-requisitos-funcionales)
12. [Casos de Uso](#12-casos-de-uso)
13. [API REST](#13-api-rest)
14. [Estado del Proyecto](#14-estado-del-proyecto)

---

## 1. Descripción del Sistema

**GestorCOC** es una plataforma web integral para el control operativo de **Centros de Operaciones y Control (COC)** de seguridad aeroportuaria.

### Propósito

El sistema digitaliza y centraliza cuatro operaciones críticas que anteriormente se gestionaban en registros físicos (libros y planillas Excel):

1. **Inventario de activos CCTV** — cámaras, domos PTZ, servidores de video, equipamiento.
2. **Bitácora operativa** — registro en tiempo real de hechos e incidentes.
3. **Gestión de novedades técnicas** — ciclo de vida de fallas de equipos.
4. **Cadena de custodia de evidencia fílmica** — registros judiciales con integridad verificable mediante hashes criptográficos.

### Contexto Operacional

- Múltiples unidades aeroportuarias (ej: AEP, EZE) operan con el mismo sistema.
- Personal con distintos roles accede a funcionalidades restringidas según su jerarquía.
- Los registros fílmicos son requeridos por juzgados y fiscalías; la trazabilidad y no-repudio son requisitos legales.

---

## 2. Arquitectura General

### Patrón de Diseño

GestorCOC implementa una **arquitectura desacoplada** de dos capas:
- **Backend**: API REST con Django + DRF, sirve únicamente JSON.
- **Frontend**: SPA (Single Page Application) con Angular, consume la API.

En producción, ambos conviven en el mismo proceso Django: WhiteNoise sirve el build compilado de Angular y Django resuelve todas las rutas `/api/...`.

### Diagrama de Bloques

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│                    Angular 21 SPA                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVIDOR DJANGO (Railway)                  │
│                                                              │
│   ┌──────────────┐   ┌─────────────────┐   ┌────────────┐  │
│   │  URL Router   │──▶│  ViewSets (DRF)  │──▶│ services/ │  │
│   └──────────────┘   └─────────────────┘   └─────┬──────┘  │
│                                                    │          │
│   ┌──────────────┐   ┌─────────────────┐   ┌─────▼──────┐  │
│   │  WhiteNoise   │   │   Django ORM     │──▶│ SQLite/PG  │  │
│   │ (SPA build)   │   │                 │   │ (Railway)  │  │
│   └──────────────┘   └─────────────────┘   └────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  IA: Gemini → Groq → OpenRouter → Ollama (fallback)  │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Capas de la Aplicación

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| **Presentación** | Angular 21 | UI, navegación, guards de rutas |
| **API** | Django REST Framework | Serialización, validación de requests |
| **Negocio** | `services.py` por app | Lógica compleja: hashes, IA, informes |
| **Datos** | Django ORM | Acceso a base de datos |
| **Persistencia** | SQLite (Local) / PostgreSQL (Prod) | Almacenamiento relacional |
| **Archivos estáticos** | WhiteNoise | Entrega del SPA Angular compilado |

---

## 3. Stack Tecnológico

### Backend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Lenguaje | Python | 3.11+ |
| Framework web | Django | 5.2 |
| API REST | Django REST Framework (DRF) | Latest |
| Autenticación | djangorestframework-simplejwt | Latest |
| Base de datos (dev) | SQLite | — |
| Base de datos (prod) | PostgreSQL | Railway managed |
| Config BD | dj-database-url | Latest |
| Documentación API | drf-spectacular (Swagger/ReDoc) | Latest |
| Generación de documentos | python-docx, reportlab | Latest |
| Integridad de archivos | hashlib (stdlib) | — |
| Servidor producción | Gunicorn | Latest |
| Archivos estáticos | WhiteNoise | Latest |

### Frontend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Angular (Standalone Components) | 21 |
| Estilos | Tailwind CSS | v4 |
| Gráficos | ApexCharts (ng-apexcharts) | Latest |
| Hash local | crypto-js | Latest |
| Exportar Excel | xlsx | Latest |

### Inteligencia Artificial

| Proveedor | Uso | Configuración |
|-----------|-----|--------------|
| **Gemini** (Google) | Proveedor primario — mejora de texto e informes | `GEMINI_API_KEY` |
| **Groq** | Fallback rápido — Llama 3 | `GROQ_API_KEY` |
| **OpenRouter** | Fallback alternativo — Claude, GPT | `OPENROUTER_API_KEY` |
| **Ollama** | Soporte local sin costo | URL configurable |

---

## 4. Infraestructura y Despliegue

### Producción (Railway)

| Componente | Valor |
|-----------|-------|
| Plataforma | Railway.app |
| Contenedor | Docker (Dockerfile en raíz) |
| Base de datos | SQLite (Local) / PostgreSQL administrado por Railway |
| Variables de entorno | Railway env vars |
| Proceso de inicio | `python manage.py migrate && gunicorn config.wsgi:application` |

### Flujo de Build en Railway

```
1. Railway detecta Dockerfile
2. Etapa frontend-builder: npm ci && npm run build
   → Produce: /app/frontend/dist/gestor-coc/browser/
3. Imagen Django: pip install -r requirements.txt
   → Copia build Angular dentro del container
   → Ejecuta: python manage.py collectstatic
4. Runtime: migrate → gunicorn
5. WhiteNoise sirve el SPA Angular
   Django resuelve /api/... y catch-all SPA para el resto
```

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://...

# Django
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=...

# IA (al menos una es obligatoria)
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
```

### Comandos de Desarrollo Local

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # Puerto 8000

# Frontend
cd frontend
npm install
npm start                           # Puerto 4200, proxy a :8000

# Seed de datos de prueba
.\tools\scripts\seed_db.ps1
```

---

## 5. Módulos del Backend

El proyecto Django está dividido en **5 aplicaciones** (apps), cada una con responsabilidad única:

### `assets` — Inventario de Activos

Gestiona la jerarquía completa del equipamiento del COC:

```
Unit (Unidad/Aeropuerto)
  └── System (Sistema CCTV / VMS)
        └── Server (Servidor NVR/DVR)
              └── Camera (Cámara individual)
  └── Gear (Equipamiento: radios, tablets, etc.)
```

Modelos principales: `Unit`, `System`, `Server`, `Camera`, `Gear`

### `novedades` — Reporte de Fallas

Ciclo de vida completo de novedades técnicas sobre activos:
- Estado: `OPEN` → `IN_PROGRESS` → `CLOSED`
- Vinculadas a un activo específico (cámara, servidor, gear)
- Autor registrado vía `Person`

Modelos principales: `Novedad`

### `hechos` — Bitácora Operativa

Registro cronológico de eventos en tiempo real:
- Categorías: `POLICIAL`, `OPERATIVO`, `INFORMATIVO`, `RELEVAMIENTO`
- Vínculo opcional a cámara de origen
- Geolocalización del hecho

Modelos principales: `Hecho`

### `personnel` — Personal y Control de Acceso

Gestiona personas (internas y externas) y el sistema de roles:
- **`Person`**: personal de seguridad con legajo, jerarquía y vinculación a usuario Django
- **`access.py`**: define `GROUP_PERMISSION_MAP` y códigos de permiso
- **`permissions.py`**: clases DRF para verificar permisos en vistas

Modelos principales: `Person`

### `records` — Registros Fílmicos e Informes

Módulo más complejo del sistema. Gestiona:
- **Cadena de custodia**: registro completo de material fílmico solicitado judicialmente
- **Integridad**: cálculo y verificación de hashes SHA-256/512
- **Verificación CREV**: bloqueo del registro tras auditoría
- **Informes IA**: generación de documentos DOCX con análisis narrativo
- **Partes diarios**: resumen operativo diario
- **Dashboard**: métricas y mapa de unidades

Modelos principales: `FilmRecord`, `FilmRecordInvolvedPerson`, `VideoAnalysisReport`, `AIUsageLog`, `Catalog`

#### Servicio Central: `IntegrityService`

```
records/services.py → IntegrityService
  ├── Calcula hashes (SHA-1, SHA-256, SHA-512, SHA-3)
  ├── Compara hash del archivo vs hash en BD
  ├── Genera informes DOCX (python-docx)
  ├── Genera certificados PDF (reportlab)
  └── Gestiona llamadas a IA con fallback automático
```

---

## 6. Módulos del Frontend

La SPA Angular está compuesta por **páginas standalone** con guards de permisos en cada ruta.

| Ruta | Permiso requerido | Descripción |
|------|------------------|-------------|
| `/login` | Público | Formulario JWT. Detecta si debe forzar cambio de contraseña |
| `/` (dashboard) | `view_dashboard` | KPIs en tiempo real: activos, novedades activas, registros pendientes. Mapa de unidades |
| `/assets` | `view_assets` | Árbol jerárquico del inventario. ABM con filtros por tipo y unidad |
| `/novedades` | `view_novedades` | Lista filtrable de novedades. Formulario de alta/edición. Historial de estados |
| `/hechos` | `view_hechos` | Bitácora cronológica. Filtros por categoría, unidad y fecha. Exportación |
| `/personnel` | `view_personnel` | Listado de personal. Vínculo con usuarios Django. Gestión de roles |
| `/records` | `view_records` | Libro de registros fílmicos. Filtros avanzados. Verificación CREV inline |
| `/integrity` | `use_integrity_tools` | Herramienta de verificación: carga archivo local, calcula hash en navegador, compara con BD |
| `/informes` | `manage_records` | Wizard de generación de informes con IA. Vista previa y descarga DOCX |
| `/settings` | `view_settings` | Perfil del usuario autenticado. Cambio de contraseña. Historial de uso de IA |

### Características Técnicas del Frontend

- **Standalone Components**: no usa NgModules. Cada componente importa sus dependencias directamente.
- **CacheService con TTL**: evita re-peticiones a la API para datos que cambian poco (unidades, personal).
- **Hash local (crypto-js)**: la verificación de integridad calcula el SHA en el navegador. El archivo nunca se sube al servidor, preservando el ancho de banda.
- **Interceptor JWT**: añade `Authorization: Bearer <token>` automáticamente a cada request.
- **Guard de permisos**: `permissionGuard` verifica permisos antes de activar cada ruta.

---

## 7. Modelo de Datos

> Todos los modelos heredan de `TimeStampedModel` que añade `created_at` y `updated_at` automáticamente.

### Diagrama de Relaciones

```
Unit ──┐
       ├── System ── Server ── Camera
       └── Gear

Person ──┬── User (Django Auth) [1:1 opcional]
         ├── FilmRecord.received_by [FK]
         └── FilmRecord.verified_by_crev [FK]

FilmRecord ──┬── FilmRecordInvolvedPerson [1:N]
             ├── VideoAnalysisReport [1:1]
             ├── Catalog [M:N]
             └── Unit.generator_unit [FK]

AIUsageLog (independiente, solo para auditoría)
```

### `FilmRecord` — Registro Fílmico (Entidad Central)

| Grupo | Campo | Descripción |
|-------|-------|-------------|
| **Solicitud** | `issue_number` | Número de asunto interno |
| | `order_number` | Número de orden en el libro |
| | `entry_date` | Fecha de ingreso (default: hoy) |
| | `request_type` | FORMULARIO / MEMORANDO / NOTA / OFICIO / EXHORTO / OTRO |
| | `request_kind` | DENUNCIA / PROCEDIMIENTO / OTRO |
| | `requester` | Nombre del solicitante externo |
| **Judicial** | `judicial_case_number` | N° causa judicial (indexado) |
| | `case_title` | Carátula del expediente |
| | `incident_date` / `incident_time` | Fecha y hora del hecho |
| | `incident_place` / `incident_sector` | Lugar del hecho |
| | `crime_type` | Tipo de delito |
| | `judicial_office` | Juzgado / Fiscalía |
| **Sistema** | `sistema` | VMS de origen (MILESTONE, DAHUA, HIKVISION, etc.) |
| | `received_by` | FK a `Person` — quién recepcionó |
| | `operator` | Texto libre — quién confeccionó |
| **Soporte** | `dvd_number` | N° de DVD entregado |
| | `description` | Detalle fílmico |
| | `report_number` / `ifgra_number` | Referencias documentales |
| **Entrega** | `delivery_status` | PENDIENTE / ENTREGADO / DERIVADO / FINALIZADO / ANULADO |
| | `delivery_date` | Fecha de salida |
| | `retrieved_by` | Quién retiró el material |
| **Integridad** | `file_hash` | Hash SHA del archivo (indexado) |
| | `hash_algorithm` | sha1 / sha256 / sha512 / sha3 |
| | `file_size` | Tamaño en bytes |
| | `is_integrity_verified` | True si hash fue verificado |
| **CREV** | `verified_by_crev` | FK a `Person` — auditor CREV |
| | `verification_date` | Timestamp de la verificación |
| | `is_editable` | **Se bloquea a False automáticamente** al verificar |

### `FilmRecordInvolvedPerson` — Personas Involucradas

| Campo | Descripción |
|-------|-------------|
| `film_record` | FK al registro |
| `role` | DAMNIFICADO / DENUNCIANTE / DETENIDO / OTRO |
| `last_name` / `first_name` | Nombre completo |
| `document_type` / `document_number` | Documento de identidad |
| `nationality` / `birth_date` | Datos personales |

### `VideoAnalysisReport` — Informe de Análisis

| Campo | Descripción |
|-------|-------------|
| `film_record` | FK 1:1 al registro (puede ser independiente) |
| `numero_informe` | Identificador del informe |
| `status` | PENDIENTE / BORRADOR / FINALIZADO |
| `form_data` | JSONField con los datos del wizard de creación |

### `AIUsageLog` — Trazabilidad de IA

| Campo | Descripción |
|-------|-------------|
| `provider` | gemini / groq / openrouter / ollama |
| `model_name` | Nombre exacto del modelo usado |
| `endpoint` | improve_text / video_report |
| `tokens_in` / `tokens_out` / `tokens_total` | Conteo de tokens por llamada |
| `success` | Si la llamada fue exitosa |

### `Unit` — Unidades

| Campo | Descripción |
|-------|-------------|
| `code` | Código IATA (AEP, EZE, etc.) |
| `parent` | FK self — jerarquía entre unidades |
| `map_enabled` | Muestra en el mapa del dashboard |

### `Person` — Personal

| Campo | Descripción |
|-------|-------------|
| `badge_number` | Legajo de 6 dígitos (único) |
| `user` | OneToOne con `auth.User` (opcional) |
| `rank` | Jerarquía: OFICIAL / INSPECTOR / COMISARIO / CIVIL / etc. |
| `is_active` | Estado del agente |

---

## 8. Roles y Permisos (RBAC)

### Roles del Sistema

| Rol | Código | Descripción |
|-----|--------|-------------|
| **Administrador** | `ADMIN` | Acceso total. Gestión de usuarios y configuración |
| **Coordinador CREV** | `COORDINADOR_CREV` | Coordina y supervisa el flujo de verificación CREV |
| **CREV** | `CREV` | Auditor — verifica registros fílmicos e integridad |
| **Coordinador COC** | `COORDINADOR_COC` | Opera el COC: gestiona activos y personal |
| **Operador** | `OPERADOR` | Operador estándar: novedades, hechos, records |
| **Solo Lectura** | `READ_ONLY` | Visualización sin modificaciones |

### Matriz de Permisos

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

### Implementación Técnica

**Backend** (`personnel/access.py`):
```python
class PermissionCode:
    VIEW_DASHBOARD = "view_dashboard"
    MANAGE_ASSETS  = "manage_assets"
    # ... etc.

GROUP_PERMISSION_MAP = {
    "ADMIN": list(CUSTOM_PERMISSION_LABELS.keys()),  # todos
    "COORDINADOR_CREV": ["view_dashboard", "view_assets", ..., "manage_crev_flow"],
    "CREV":             ["view_dashboard", ..., "verify_crev_record"],
    # ...
}
```

**Frontend** (`auth.service.ts`):
```typescript
hasPermission(code: string): boolean {
  return !!this.userState()?.permission_codes.includes(code);
}
```

---

## 9. Autenticación y Seguridad

### Flujo de Autenticación JWT

```
1. POST /api/auth/login/   { username, password }
       ↓
2. Response:
   {
     "access":  "<JWT access token>",
     "refresh": "<JWT refresh token>",
     "user": {
       "username":         "operador_1",
       "role":             "OPERADOR",
       "permission_codes": ["view_dashboard", "view_assets", ...],
       "must_change_password": false
     }
   }
       ↓
3. Frontend almacena tokens en estado (no localStorage por seguridad)
       ↓
4. Cada request: Authorization: Bearer <access_token>
       ↓
5. Backend valida token → verifica permisos → responde
```

### Tokens

| Token | Duración |
|-------|---------|
| Access token | 30 minutos |
| Refresh token | 7 días |

### Políticas de Seguridad

- **Contraseña forzada**: usuarios nuevos deben cambiar contraseña en el primer login.
- **Superusuarios Django**: bypasan todas las verificaciones de permisos custom.
- **Endpoints protegidos por defecto**: todas las vistas requieren autenticación JWT.
- **Permisos por acción**: cada endpoint verifica el permiso específico para la operación (list/create/update/destroy).

### Usuarios Seed de Prueba

| Username | Rol |
|----------|-----|
| `admin` | ADMIN |
| `coord_coc_1` | COORDINADOR_COC |
| `coord_crev_1` | COORDINADOR_CREV |
| `crev_1` | CREV |
| `operador_1` | OPERADOR |
| `generico_1` | READ_ONLY |

---

## 10. Inteligencia Artificial

### Funcionalidades IA

El sistema integra IA en dos endpoints principales:

| Endpoint | Función |
|----------|---------|
| `POST /api/records/improve-text/` | Mejora y formaliza texto narrativo de un hecho o descripción |
| `POST /api/records/generate-report/` | Genera el cuerpo de un informe de análisis fílmico en lenguaje formal |

### Estrategia Multi-Proveedor con Fallback

```
Request → Gemini (primario)
              │ si falla
              ▼
           Groq (Llama 3)
              │ si falla
              ▼
         OpenRouter (Claude/GPT)
              │ si falla
              ▼
          Ollama (local)
              │ si falla
              ▼
         Error 503 (todos los proveedores fallaron)
```

### Trazabilidad

Cada llamada a la IA queda registrada en `AIUsageLog` con:
- Proveedor y modelo exacto usado
- Tokens de entrada, salida y totales
- Si la llamada fue exitosa
- Timestamp

---

## 11. Requisitos Funcionales

### RF-01: Gestión de Inventario de Activos
- El sistema debe permitir registrar unidades (aeropuertos) con código único.
- Cada unidad puede tener sistemas CCTV con sus servidores y cámaras asociadas.
- El usuario con permiso `manage_assets` puede crear, editar y eliminar activos.
- El inventario debe mostrar la jerarquía completa en formato de árbol.

### RF-02: Gestión de Novedades Técnicas
- El sistema debe registrar fallas técnicas vinculadas a un activo específico.
- Las novedades tienen un ciclo de vida: `OPEN` → `IN_PROGRESS` → `CLOSED`.
- Solo roles con `manage_novedades` pueden modificar el estado.
- El historial de cambios de estado debe ser trazable.

### RF-03: Bitácora de Hechos Operativos
- El sistema debe permitir registrar eventos operativos en tiempo real.
- Cada hecho debe clasificarse por categoría (POLICIAL, OPERATIVO, INFORMATIVO, RELEVAMIENTO).
- Puede vincularse opcionalmente a una cámara específica.
- Los hechos no pueden modificarse una vez registrados (solo lectura histórica).

### RF-04: Libro de Registros Fílmicos
- El sistema debe replicar digitalmente el Libro de Registros Fílmicos físico.
- Cada registro debe capturar datos de solicitud judicial, datos del hecho, datos del material y estado de entrega.
- Los registros deben soportar múltiples personas involucradas (damnificados, detenidos, etc.).
- El número de orden debe ser único y autoincremental.

### RF-05: Integridad Criptográfica
- El sistema debe calcular el hash SHA del material fílmico sin subir el archivo al servidor.
- El hash calculado en el navegador (crypto-js) debe poder compararse con el hash almacenado en BD.
- Algoritmos soportados: SHA-1, SHA-256, SHA-512, SHA-3.
- El resultado de la verificación debe quedar registrado en el `FilmRecord`.

### RF-06: Verificación CREV
- Solo roles con `verify_crev_record` pueden ejecutar la verificación CREV.
- Al verificar: se registra el auditor (`verified_by_crev`), la fecha y se bloquea el registro (`is_editable = False`).
- Un registro bloqueado no puede ser modificado por ningún rol.
- Solo `ADMIN` puede desbloquear un registro verificado.

### RF-07: Generación de Informes con IA
- El sistema debe proveer un wizard de creación de informes vinculado a un `FilmRecord`.
- La IA debe generar el cuerpo narrativo del informe en lenguaje formal/judicial.
- El usuario puede editar el texto generado antes de finalizar.
- El informe finalizado puede descargarse en formato DOCX.

### RF-08: Dashboard Operacional
- El dashboard debe mostrar KPIs en tiempo real: total de novedades activas, registros pendientes, hechos del día.
- Debe incluir un mapa geográfico con el estado de las unidades habilitadas (`map_enabled = True`).
- Los datos del dashboard deben actualizarse sin recargar la página.

### RF-09: Gestión de Usuarios y Roles
- Solo el rol `ADMIN` puede crear, editar o desactivar usuarios.
- Cada usuario puede estar vinculado a un `Person` con datos de personal.
- Los nuevos usuarios deben forzar el cambio de contraseña en el primer acceso.
- El sistema debe soportar los 6 roles definidos con sus permisos asociados.

### RF-10: Partes Diarios
- El sistema debe generar un resumen diario de la actividad operativa.
- El parte debe incluir hechos, novedades y registros del día.
- Exportable en formato PDF o DOCX.

---

## 12. Casos de Uso

### UC-01: Reportar Novedad de Equipo

```
Actor principal: OPERADOR / COORDINADOR_COC / ADMIN
Pre-condición:  Usuario autenticado con permiso manage_novedades
Post-condición: Novedad creada en estado OPEN

Flujo Principal:
  1. Usuario navega a /novedades
  2. Selecciona "Nueva Novedad"
  3. Elige el activo afectado (cámara, servidor, gear)
  4. Describe la falla técnica
  5. Sistema crea la novedad con estado OPEN y timestamp
  6. Opcional: cambiar estado a IN_PROGRESS (asignar responsable)
  7. Cierre: cambiar estado a CLOSED con descripción de resolución

Flujos alternos:
  - El activo no existe: crear activo primero (requiere manage_assets)
```

### UC-02: Registrar Hecho en Bitácora

```
Actor principal: OPERADOR / COORDINADOR_COC / ADMIN
Pre-condición:  Usuario autenticado con permiso manage_hechos
Post-condición: Hecho registrado en la bitácora

Flujo Principal:
  1. Usuario navega a /hechos
  2. Selecciona "Nuevo Hecho"
  3. Elige categoría (POLICIAL, OPERATIVO, INFORMATIVO, RELEVAMIENTO)
  4. Describe el hecho con fecha/hora exacta
  5. Opcionalmente vincula a una cámara específica
  6. Sistema registra el hecho con timestamp inmutable
```

### UC-03: Gestión Completa de Registro Fílmico

```
Actor principal: OPERADOR / CREV / COORDINADOR_CREV / ADMIN
Pre-condición:  Usuario autenticado con permiso manage_records
Post-condición: Registro fílmico creado con cadena de custodia completa

Flujo Principal:
  1. Sistema recibe solicitud judicial (formulario/memorando)
  2. Operador crea FilmRecord con datos de la solicitud
  3. Material es extraído del sistema CCTV
  4. Operador registra el hash SHA del archivo
  5. Estado: PENDIENTE
  6. Material se entrega (físicamente) a quien lo solicitó
  7. Operador actualiza estado a ENTREGADO y registra acta de entrega
  8. CREV verifica el registro (bloquea edición)
  9. Estado final: FINALIZADO
```

### UC-04: Verificación de Integridad de Evidencia

```
Actor principal: CREV / COORDINADOR_CREV / ADMIN
Pre-condición:  Usuario con permiso use_integrity_tools
                FilmRecord con file_hash registrado
Post-condición: Verificación de integridad registrada en el sistema

Flujo Principal:
  1. Usuario navega a /integrity
  2. Selecciona el FilmRecord a verificar
  3. Arrastra/selecciona el archivo de video local
  4. JavaScript (crypto-js) calcula hash SHA en el navegador
     → El archivo NUNCA se sube al servidor
  5. Sistema compara: hash calculado vs file_hash en BD
  6. Resultado OK: is_integrity_verified = True
     Resultado NOK: alerta de posible alteración del archivo
  7. Resultado queda registrado en el FilmRecord
```

### UC-05: Generación de Informe con IA

```
Actor principal: OPERADOR / CREV / COORDINADOR_CREV / ADMIN
Pre-condición:  Usuario con permiso manage_records
                FilmRecord existente (o informe independiente)
Post-condición: Informe DOCX generado y disponible para descarga

Flujo Principal:
  1. Usuario navega a /informes
  2. Selecciona "Nuevo Informe" → elige FilmRecord de origen
  3. Sistema pre-carga datos del registro en el wizard
  4. Usuario completa campos del wizard (período, descripción, etc.)
  5. Usuario solicita "Generar con IA"
  6. Backend llama al proveedor de IA activo con el prompt estructurado
  7. IA retorna el texto narrativo del análisis
  8. Usuario revisa y edita el texto generado
  9. Usuario finaliza → sistema guarda VideoAnalysisReport (FINALIZADO)
  10. Sistema genera DOCX descargable con membrete y firma

Flujos alternos:
  - Proveedor IA falla: sistema prueba con el siguiente en la cadena
  - Todos los proveedores fallan: error 503, usuario puede escribir manualmente
```

### UC-06: Verificación CREV de Registro

```
Actor principal: CREV / COORDINADOR_CREV / ADMIN
Pre-condición:  Usuario con permiso verify_crev_record
                FilmRecord en estado editable
Post-condición: Registro bloqueado con sello CREV

Flujo Principal:
  1. CREV accede a /records
  2. Selecciona el registro a verificar
  3. Revisa todos los datos del registro
  4. Confirma la verificación
  5. Sistema registra: verified_by_crev, verification_date
  6. Sistema setea is_editable = False (bloqueo permanente)
  7. Registro queda sellado con la identidad del verificador
```

### UC-07: Dashboard y Mapa Operacional

```
Actor principal: Todos los roles
Pre-condición:  Usuario autenticado (cualquier rol)
Post-condición: Vista actualizada del estado operativo

Flujo Principal:
  1. Usuario accede a /
  2. Sistema carga KPIs en tiempo real:
     - Novedades activas (OPEN + IN_PROGRESS)
     - Registros fílmicos pendientes
     - Hechos del día
     - Usuarios activos
  3. Mapa muestra estado de unidades con map_enabled = True
  4. Usuario puede filtrar por unidad o período
```

---

## 13. API REST

### Documentación Interactiva

La API está documentada con `drf-spectacular`. En desarrollo:
- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`

### Endpoints Principales

| Método | Endpoint | Permiso | Descripción |
|--------|---------|---------|-------------|
| POST | `/api/auth/login/` | Público | Login JWT |
| POST | `/api/auth/token/refresh/` | Público | Renovar access token |
| GET/POST | `/api/assets/units/` | `view_assets` | Listar / crear unidades |
| GET/PUT | `/api/assets/units/{id}/` | `view_assets` | Detalle / editar unidad |
| GET/POST | `/api/assets/cameras/` | `view_assets` | Inventario de cámaras |
| GET/POST | `/api/novedades/` | `view_novedades` | Listar / crear novedades |
| PATCH | `/api/novedades/{id}/` | `manage_novedades` | Actualizar estado |
| GET/POST | `/api/hechos/` | `view_hechos` | Bitácora de hechos |
| GET/POST | `/api/records/film-records/` | `view_records` | Libro de registros |
| POST | `/api/records/film-records/{id}/verify/` | `verify_crev_record` | Verificar CREV |
| POST | `/api/records/integrity/verify-hash/` | `use_integrity_tools` | Verificar hash server-side |
| POST | `/api/records/improve-text/` | `manage_records` | Mejorar texto con IA |
| GET/POST | `/api/records/reports/` | `manage_records` | Gestión de informes |
| POST | `/api/records/reports/{id}/generate/` | `manage_records` | Generar informe con IA |
| GET | `/api/personnel/persons/` | `view_personnel` | Listado de personal |
| GET/POST | `/api/personnel/users/` | `manage_users` | Gestión de usuarios Django |
| GET | `/api/dashboard/stats/` | `view_dashboard` | KPIs del dashboard |
| GET | `/api/dashboard/map/` | `view_dashboard` | Datos del mapa |

---

## 14. Estado del Proyecto

> Última actualización: marzo 2026

### Estado por Capa

| Capa | Estado |
|------|--------|
| Backend API (Django + DRF) | ✅ Completo y estable |
| Base de datos (SQLite/PostgreSQL) | ✅ Migrada y con datos seed |
| Frontend SPA (Angular 21) | ✅ Funcional |
| Autenticación JWT + Roles | ✅ Implementada |
| Deploy en Railway | ✅ Activo |

### Estado por App

| App | Modelos | API | Filtros | Tests |
|-----|---------|-----|---------|-------|
| `assets` | ✅ | ✅ | ✅ | Parcial |
| `novedades` | ✅ | ✅ | ✅ | Parcial |
| `hechos` | ✅ | ✅ | ✅ | Parcial |
| `personnel` | ✅ | ✅ | ✅ | ✅ |
| `records` | ✅ | ✅ | ✅ | ✅ |
| Dashboard / Mapa | ✅ | ✅ | ✅ | Parcial |
| IA (Gemini/Groq/OpenRouter) | ✅ | ✅ | — | Parcial |

### Estado por Ruta Frontend

| Ruta | Estado | Notas |
|------|--------|-------|
| `/login` | ✅ OK | Login JWT, fuerza cambio de contraseña |
| `/` | ✅ OK | Dashboard protegido |
| `/assets` | ✅ OK | Acciones limitadas por permisos |
| `/novedades` | ✅ OK | Filtros y permisos activos |
| `/hechos` | ✅ OK | Filtros y permisos activos |
| `/personnel` | ✅ OK | Roles nuevos y restricciones activas |
| `/records` | ✅ OK | Verificación CREV y permisos |
| `/integrity` | ✅ OK | Hash local + comparación |
| `/informes` | ✅ OK | Wizard con IA funcional |
| `/settings` | ✅ OK | Perfil + cambio de contraseña |

---

*GestorCOC — Documentación General del Sistema | Marzo 2026*
