# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Guía técnica para agentes que trabajen sobre este repositorio.

## Resumen del Proyecto

GestorCOC es un sistema de gestión para Centro de Operaciones y Control (COC), con arquitectura desacoplada:

- **Backend API**: Django 6 + Django REST Framework + PostgreSQL (producción) / SQLite (desarrollo).
- **Frontend SPA**: Angular 21 (standalone components) + Tailwind CSS v4.

El backend **no** renderiza templates para la UI principal; expone únicamente APIs REST. El frontend compilado es servido por WhiteNoise desde el mismo proceso Django.

> **Nota:** La carpeta `docs/` contiene documentos de una arquitectura anterior (SSR + HTMX + Oracle) que fue descartada. No reflejan el sistema actual.

---

## Comandos

### Backend (ejecutar desde `backend/`)

El `manage.py` y el venv (`.venv/`) están en `backend/` directamente.

```powershell
# Servidor de desarrollo (puerto 8000)
.venv\Scripts\python.exe manage.py runserver

# Tests — solo records/ tiene suites reales
.venv\Scripts\python.exe manage.py test records
.venv\Scripts\python.exe manage.py test records.tests.FilmRecordAPITest
# Otras clases en records/tests.py:
#   VideoAnalysisReportApiTests, VideoAnalysisImproveTextApiTests
#   IntegrityServiceAiRequestTests, SerializerLimitConsistencyTests

# Migraciones
.venv\Scripts\python.exe manage.py makemigrations
.venv\Scripts\python.exe manage.py migrate

# Seed de datos demo (única herramienta de seed)
.venv\Scripts\python.exe manage.py seed_data
.venv\Scripts\python.exe manage.py seed_data --mode reset --volume high
# Opciones: --mode [reset|fill_missing|append]  --volume [low|medium|high]  --dry-run
```

### Frontend (ejecutar desde `frontend/`)

```powershell
npm start          # dev server en :4200, proxy a :8000
npm run build
npm test
```

`environment.ts` apunta a `http://localhost:8000` como `apiUrl`.

### Documentación de API

- Swagger: `http://localhost:8000/swagger/` o `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

---

## Arquitectura

### Backend (`backend/`)

Patrón por app: `models → serializers → views (ViewSets/APIViews) → urls`.

| App | Responsabilidad |
|-----|-----------------|
| `config/` | Settings, URL root, DRF/Spectacular config |
| `core/` | `TimeStampedModel` (base con `created_at`/`updated_at`) + comando `seed_data` |
| `assets/` | Unidades, sistemas CCTV, servidores, cámaras, equipamiento de camarógrafo |
| `novedades/` | Novedades operativas (fallas, eventos) |
| `personnel/` | Personal del COC |
| `records/` | Registros fílmicos, informes de integridad, informes de análisis de video, IA, dashboard |
| `hechos/` | Bitácora operativa |

#### Jerarquía de activos

```
Unit (COC / aeropuerto)
  └── System (NVR o CCTV, type: NVR | CCTV)
        └── Server (IP única)
              └── Camera (ONLINE | OFFLINE | MAINTENANCE)
```

`CameramanGear` es independiente de la jerarquía anterior.

#### Roles de Person

`Person.ROLE_CHOICES`: `OPERATOR` / `SUPERVISOR` / `ADMIN`.
- Solo `SUPERVISOR` puede actuar como verificador CREV en `film-records/{id}/verify_by_crev/`.

#### Campos de legado en modelos

Dos campos FK fueron migrados desde texto libre; los valores históricos se preservan:

- `Novedad.reported_by` → FK nullable a `Person`; texto original en `reporter_name` (CharField).
- `CameramanGear.assigned_to` → FK nullable a `Person`; texto original en `assigned_to_name` (CharField).

Los serializers exponen `reported_by_name` y `assigned_to_display` como campos read-only calculados.

#### Endpoints completos bajo `/api/`

**CRUD (DRF router):**
- `api/systems/`, `api/servers/`, `api/cameras/`, `api/cameraman-gear/`, `api/units/`
- `api/people/`
- `api/novedades/`
- `api/hechos/`
- `api/film-records/` (acciones extra: `verify_by_crev`, `verification_certificate`, `save_report_draft`)
- `api/catalogs/`
- `api/video-analysis-reports/`

**Vistas específicas:**
- `api/integrity-check/` — POST, calcula hash de archivo subido
- `api/integrity-summary-report/` — POST, genera PDF resumen de hashes
- `api/video-analysis-report/` — POST, genera DOCX de informe
- `api/video-analysis-improve-text/` — POST, mejora texto con IA
- `api/ai-usage-daily/` — GET, resumen de uso de IA por día/proveedor
- `api/dashboard-stats/` — GET, conteos mensuales/diarios (records, hechos, novedades)
- `api/dashboard/novedades/`, `api/dashboard/hechos/`, `api/dashboard/records/`, `api/dashboard/personnel/` — GET con filtros
- `api/dashboard/map/` — GET, puntos georreferenciados de unidades con conteos
- `api/health/` — health check

#### Informes e IA (`records/services.py`)

`IntegrityService` centraliza toda la lógica: hash de archivo, generación de PDF de integridad, generación de DOCX de análisis de video, mejora textual con IA, log de uso (`AIUsageLog`).

Límites (en `config/settings.py`):
- `VIDEO_REPORT_MAX_FRAMES = 30`
- `VIDEO_REPORT_MAX_FRAME_SIZE_BYTES = 8 MB`
- `VIDEO_REPORT_MAX_TOTAL_BYTES = 80 MB`

Proveedores IA soportados (configurar en `backend/.env`, ver `backend/.env.example`): **Gemini, OpenRouter, Groq, Ollama**.
Variables clave: `AI_TEXT_PROVIDER_ORDER`, `AI_TEXT_PROVIDER_SELECTION`, `AI_TEXT_FALLBACK_MODE`.
`settings.py` carga `.env` con `_load_local_env_file()` (sin `python-dotenv`).

Hash algorithms válidos: `sha1`, `sha3`, `sha256`, `sha512` (en serializers y en `HashService` del frontend).

#### Base de datos y despliegue

- Desarrollo: SQLite (`backend/db.sqlite3`).
- Producción: PostgreSQL vía `DATABASE_URL` env var (`dj-database-url`). Railway usa esta variable.
- Al migrar campos de tipo a FK en PostgreSQL, las migraciones que mezclan DDL deben marcarse `atomic = False`.
- Frontend compilado (`frontend/dist/gestor-coc/browser/`) servido por **WhiteNoise** (`WHITENOISE_ROOT`).

---

### Frontend (`frontend/src/app/`)

#### Rutas SPA

| Ruta | Página | APIs principales |
|------|--------|-----------------|
| `/` | Dashboard | `api/dashboard/*`, `api/dashboard/map/` |
| `/assets` | Equipamiento | `api/systems`, `api/servers`, `api/cameras`, `api/cameraman-gear`, `api/units` |
| `/novedades` | Novedades | `api/novedades` |
| `/personnel` | Personal | `api/people` |
| `/records` | Registros fílmicos | `api/film-records`, `api/catalogs` |
| `/hechos` | Bitácora | `api/hechos` |
| `/integrity` | Verificación de integridad | Hash local + `api/integrity-summary-report` |
| `/informes` | Generador de informes | `api/video-analysis-improve-text`, `api/video-analysis-report` |
| `/settings` | Configuración | — |

#### Servicios frontend

- `ApiService` — wrapper HTTP base (`get/post/put/patch/delete`). Usar para todas las llamadas estándar.
- `CacheService` — caché TTL en `localStorage`. Constantes: `TTL.SHORT` (5 min), `TTL.MEDIUM` (15 min), `TTL.LONG` (30 min). Método principal: `withCache(key, ttl, source$)`. Prefijo de keys: `gestorcoc_cache_`.
- `LoadingService` — contador de requests pendientes (`show()`/`hide()`); `isLoading` es `computed(() => pendingCount() > 0)`. No usar `.set()` directamente.
- `ToastService` — notificaciones globales.
- `HashService` — cálculo de hash local en el browser (SHA-256, SHA-512, SHA-3); usado en `/integrity`.
- `InformeService` — generación de informe de análisis de video.
- `DashboardService` — llamadas a los endpoints de dashboard con filtros por módulo.

Excepción aceptada: `HttpClient` directo (sin `ApiService`) cuando se requiere `Blob`, `FormData` o respuestas especiales.

---

## Flujo de Informes (Integridad y Autenticidad)

Tipos relevantes (`informe.service.ts`):
- `VideoReportHashAlgorithm`: `sha1 | sha3 | sha256 | sha512 | otro`
- `VideoReportVmsAuthenticityMode`: `vms_propio | hash_preventivo | sin_autenticacion | otro`

Reglas de negocio:
- `export_file_format` obligatorio; si es `otro` → `export_file_format_other` obligatorio.
- `vms_authenticity_mode` obligatorio; si es `otro` → `vms_authenticity_detail` obligatorio.
- Si `vms_authenticity_mode = hash_preventivo`: se requiere al menos un algoritmo; `hash_program` se autocompleta con `HashMyFiles`.
- Si algoritmo `otro` → `hash_algorithm_other` obligatorio.
- La UI genera `.doc` localmente; la mejora IA se delega al backend.

---

## UI y Estilo Global

- Tailwind CSS v4. Reglas globales en `frontend/src/styles.css`.
- Modo compacto global aplicado desde el shell: clase `ui-compact`.
- Reutilizar utilidades globales: `table-head-cell`, `table-body-cell`, `table-action-btn`.
- No usar estilos inline ad hoc; priorizar clases Tailwind y utilidades globales.

---

## Patrones y Convenciones

### Serializers

- Exponer campos de visualización (`*_name`, `*_full_name`, `*_display`) junto a FK IDs.
- No asumir nested writable serializers salvo implementación explícita.
- Campos `reported_by_name` y `assigned_to_display` son read-only derivados; no se escriben.

### Convenciones de código

- Commits con prefijos: `feat:`, `fix:`, `refactor:`, `chore:`.
- Frontend: Prettier (100 chars, single quotes).
- Backend: PEP8 / estilo Django.

---

## Known Caveats

1. Playwright MCP puede fallar por sesión bloqueada (`Browser is already in use`) o `Transport closed`. Usar chrome-devtools MCP como fallback para smoke visual.
2. En validaciones E2E de tablas extensas (ej. `records` en mobile), contemplar scroll horizontal.
3. Al correr `makemigrations` que cambia tipo de columna en PostgreSQL (ej. CharField → FK), la migración generada puede requerir `atomic = False` y SQL explícito para soltar el NOT NULL antes del AlterField.
4. Solo `records/tests.py` tiene suites de tests reales. `hechos/tests.py` está vacío.
