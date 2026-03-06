# Documentacion del Sistema GestorCOC

> **Vision**: Plataforma central para la gestion tecnica y operativa de Centros de Operaciones y Control (COC) aeroportuarios.
> **Mision**: Trazabilidad de activos CCTV, evidencia digital, novedades operativas y personal.

---

## Indice

1. [Vision y Alcance](#1-vision-y-alcance)
2. [Roles y Permisos](#2-roles-y-permisos)
3. [Modulos del Sistema](#3-modulos-del-sistema)
4. [API REST](#4-api-rest)
5. [Integracion de IA](#5-integracion-de-ia)
6. [Requisitos Tecnicos](#6-requisitos-tecnicos)
7. [Configuracion y Despliegue](#7-configuracion-y-despliegue)

---

# 1. Vision y Alcance

GestorCOC gestiona dos dominios criticos:

1. **Infraestructura CCTV**: Inventario jerarquico (Unidad → Sistema → Servidor → Camara) con registro de novedades y estado operativo.
2. **Evidencia Digital**: Cadena de custodia de registros filmicos con verificacion de integridad criptografica (SHA-1/3/256/512) y certificacion CREV.

Ademas incluye modulos de soporte: bitacora de hechos operativos, gestion de personal, informes de analisis de video asistidos por IA y dashboard de KPIs.

---

# 2. Roles y Permisos

| Rol | Codigo | Responsabilidades principales |
|-----|--------|-------------------------------|
| **Operador COC** | `OPERADOR` | Carga de novedades, hechos, registros filmicos, calculo de hash |
| **Fiscalizador CREV** | `SUPERVISOR` | Verificacion y certificacion de registros filmicos, supervision de inventario |
| **Administrador** | `ADMIN` | ABM de unidades, sistemas, personal; configuracion global |

> **Regla critica**: Solo `SUPERVISOR` puede ejecutar `verify_by_crev` en registros filmicos.

### Jerarquias de Personal

- `Person`: Personal interno del COC (con legajo de 6 digitos, jerarquia policial o CIVIL).
- `ExternalPerson`: Personal externo (DNI, email, funcion) — para registro de visitas o tecnicos DGT.

---

# 3. Modulos del Sistema

## 3.1 Gestion de Activos (`/assets`)

### Jerarquia

```
Unit (COC / Aeropuerto)
  ├── parent: Unit (CREV u organizacion superior)
  └── System (NVR | CCTV)
        └── Server (IP unica)
              └── Camera (ONLINE | OFFLINE | MAINTENANCE)

CameramanGear  ← equipamiento de camarografo (chaleco, radio, etc.)
```

### Campos relevantes

- **Unit**: `code` (unico), coordenadas GPS para mapa, `map_enabled`.
- **Camera**: `status` (ONLINE / OFFLINE / MAINTENANCE), `resolution`.
- **CameramanGear**: `condition` (NEW/GOOD/FAIR/POOR/BROKEN), asignacion a `Person`.

**Endpoints CRUD**: `api/units/`, `api/systems/`, `api/servers/`, `api/cameras/`, `api/cameraman-gear/`

---

## 3.2 Novedades Operativas (`/novedades`)

Registro de fallas y eventos tecnicos sobre activos CCTV.

| Campo | Descripcion |
|-------|-------------|
| Activo afectado | Camera, System, Server o CameramanGear (FK nullable) |
| `severity` | LOW / MEDIUM / HIGH / CRITICAL |
| `incident_type` | Texto libre (ej: CONECTIVIDAD, DAÑO_FISICO) |
| `status` | OPEN → IN_PROGRESS → CLOSED |
| `external_ticket_id` | ID del ticket en DGT/CCO |

Paginacion activa. Filtros por severidad y estado en encabezado de tabla.

**Endpoint CRUD**: `api/novedades/`

---

## 3.3 Registros Filmicos (`/records`)

Cadena de custodia completa para solicitudes de evidencia judicial.

### Estados de entrega

```
PENDIENTE → ENTREGADO / DERIVADO / FINALIZADO / ANULADO
```

### Flujo de verificacion CREV

```
1. Operador crea registro + ingresa backup path + hash
2. CREV ejecuta verify_by_crev
3. Sistema bloquea el registro (is_editable = False)
4. CREV descarga certificado PDF
```

### Campos clave

- `judicial_case_number`: Nro de causa (indexado).
- `file_hash` + `hash_algorithm`: Huella criptografica del archivo.
- `verified_by_crev`: FK a Person con `role = SUPERVISOR`.
- `is_editable`: Auto-`False` al verificar.

### Acciones extra

| Accion | Endpoint | Descripcion |
|--------|----------|-------------|
| Verificar CREV | `POST /api/film-records/{id}/verify_by_crev/` | Certifica el registro |
| Certificado | `GET /api/film-records/{id}/verification_certificate/` | PDF del certificado |
| Guardar borrador informe | `POST /api/film-records/{id}/save_report_draft/` | Persiste datos del wizard |

---

## 3.4 Verificacion de Integridad (`/integrity`)

Calculo de hash de archivos directamente en el browser (sin subir al servidor).

- **HashService** (frontend): SHA-256, SHA-512, SHA-3 via Web Crypto API.
- El usuario puede comparar el hash calculado con el registrado en un `FilmRecord`.
- Generacion de informe PDF resumen con todos los hashes: `POST /api/integrity-summary-report/`

**Hash algorithms validos**: `sha1`, `sha3`, `sha256`, `sha512`

---

## 3.5 Informes de Analisis de Video (`/informes`)

Wizard para generar documentos DOCX formales de analisis de video con asistencia IA.

### Reglas de negocio del wizard

| Campo | Regla |
|-------|-------|
| `export_file_format` | Obligatorio; si `otro` → `export_file_format_other` obligatorio |
| `vms_authenticity_mode` | Obligatorio; si `otro` → `vms_authenticity_detail` obligatorio |
| `hash_preventivo` | Requiere al menos un algoritmo; `hash_program` = `HashMyFiles` auto |
| Algoritmo `otro` | `hash_algorithm_other` obligatorio |

### Endpoints

- `POST /api/video-analysis-improve-text/` — mejora el texto descriptivo via IA
- `POST /api/video-analysis-report/` — genera el DOCX
- `GET /api/video-analysis-reports/` — historial de informes persistidos

---

## 3.6 Hechos Operativos (`/hechos`)

Bitacora de eventos policiales/operativos observados desde el COC.

| Campo | Descripcion |
|-------|-------------|
| `category` | POLICIAL / OPERATIVO / INFORMATIVO / RELEVAMIENTO |
| `camera` | Camara desde la que se observo (nullable) |
| `intervening_groups` | Policia, SAME, Bomberos, etc. |
| `is_solved`, `coc_intervention`, `generated_cause` | Flags de resultado |

Paginacion activa. Filtros por categoria y estado.

**Endpoint CRUD**: `api/hechos/`

---

## 3.7 Personal (`/personnel`)

Gestion del personal interno del COC.

| Campo | Descripcion |
|-------|-------------|
| `badge_number` | Legajo unico de 6 digitos |
| `role` | OPERADOR / SUPERVISOR / ADMIN |
| `rank` | Jerarquia policial (Inspector, Oficial, etc.) o CIVIL |
| `guard_group` | Grupo de guardia (turno) |
| `assigned_systems` | Sistemas CCTV asignados (M2M) |

**Endpoints CRUD**: `api/people/`, `api/external-people/`

---

## 3.8 Dashboard (`/`)

Vista operacional con KPIs y mapa.

| Endpoint | Descripcion |
|----------|-------------|
| `GET /api/dashboard/novedades/` | Conteos y tendencias de novedades |
| `GET /api/dashboard/hechos/` | Conteos de hechos por categoria |
| `GET /api/dashboard/records/` | Estado de registros filmicos |
| `GET /api/dashboard/personnel/` | Resumen de personal |
| `GET /api/dashboard/map/` | Unidades con coordenadas y conteos (mapa) |
| `GET /api/dashboard-stats/` | KPIs globales mensuales/diarios |
| `GET /api/ai-usage-daily/` | Uso de IA por dia y proveedor |

---

# 4. API REST

Base URL: `/api/`

### CRUD estandar (DRF Router)

```
GET/POST    /api/{recurso}/
GET/PATCH/PUT/DELETE /api/{recurso}/{id}/
```

### Paginacion

Todos los listados responden con:
```json
{
  "count": 150,
  "next": "/api/film-records/?page=2",
  "previous": null,
  "results": [...]
}
```
`PAGE_SIZE = 50`. Parametros: `?page=N&search=X&campo=valor`.

### Documentacion interactiva

- Swagger: `/swagger/` o `/api/schema/swagger-ui/`
- ReDoc: `/api/schema/redoc/`

---

# 5. Integracion de IA

`IntegrityService` en `records/services.py` gestiona toda la logica de IA.

### Proveedores soportados (configurar en `backend/.env`)

| Variable | Descripcion |
|----------|-------------|
| `AI_TEXT_PROVIDER_ORDER` | Orden de intentos: ej. `gemini,groq,openrouter` |
| `AI_TEXT_PROVIDER_SELECTION` | Proveedor fijo o `auto` |
| `AI_TEXT_FALLBACK_MODE` | `sequential` (prueba el siguiente si falla) |

### Limites de generacion de informe de video

| Parametro | Valor |
|-----------|-------|
| `VIDEO_REPORT_MAX_FRAMES` | 30 frames |
| `VIDEO_REPORT_MAX_FRAME_SIZE_BYTES` | 8 MB por frame |
| `VIDEO_REPORT_MAX_TOTAL_BYTES` | 80 MB total |

### Log de uso

Cada llamada IA queda registrada en `AIUsageLog` con tokens consumidos, proveedor y exito/fallo.

---

# 6. Requisitos Tecnicos

## Tecnologias

| Capa | Tecnologia |
|------|------------|
| Backend | Django 5.2 + Django REST Framework |
| Base de datos (dev) | SQLite |
| Base de datos (prod) | PostgreSQL (via `DATABASE_URL`) |
| Frontend | Angular 21 (standalone) + Tailwind CSS v4 |
| API docs | drf-spectacular (OpenAPI 3) |
| Static files | WhiteNoise |
| Deploy | Railway (Gunicorn) |

## Seguridad

- Verificacion criptografica de evidencia: hashes inmutables post-certificacion CREV.
- `is_editable = False` automatico al verificar un registro filmico.
- Solo `SUPERVISOR` puede certificar; validado en la accion `verify_by_crev`.
- CSRF nativo de Django para endpoints que lo requieran.

## Rendimiento

- Paginacion global (50 items/pagina) en todos los listados.
- Indices de base de datos en campos criticos: `judicial_case_number`, `file_hash`, `entry_date`, `delivery_status`.
- `CacheService` en el frontend: TTL corto (5 min), medio (15 min) y largo (30 min) para reducir llamadas redundantes.

---

# 7. Configuracion y Despliegue

### Variables de entorno clave (`backend/.env`)

```env
DATABASE_URL=postgres://...          # Produccion
SECRET_KEY=...
DEBUG=False

AI_TEXT_PROVIDER_ORDER=gemini,openrouter,groq
AI_TEXT_PROVIDER_SELECTION=round_robin
AI_TEXT_FALLBACK_MODE=quota_only
AI_TEXT_TIMEOUT_SECONDS=45

GEMINI_API_KEY=...
OPEN_ROUTER_API_KEY=...
GROQ_API_KEY=...
```

Ver `backend/.env.example` para la lista completa.

### Comandos de gestion

```bash
# Migraciones
.venv\Scripts\python.exe manage.py makemigrations
.venv\Scripts\python.exe manage.py migrate

# Seed de datos demo
.venv\Scripts\python.exe manage.py seed_data --mode reset --volume high

# Tests (solo records/ tiene suites completas)
.venv\Scripts\python.exe manage.py test records
```

### Nota sobre migraciones en PostgreSQL

Al migrar campos de tipo CharField → FK en produccion, las migraciones que mezclan DDL
pueden requerir `atomic = False` y SQL explicito para soltar NOT NULL antes del AlterField.
