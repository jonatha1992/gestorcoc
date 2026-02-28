# CLAUDE.md

Guía técnica para agentes que trabajen sobre este repositorio.

## Resumen del Proyecto

GestorCOC es un sistema de gestión para Centro de Operaciones y Control (COC), con arquitectura desacoplada:

- Backend API: Django + Django REST Framework.
- Frontend SPA: Angular 21 (standalone components) + Tailwind CSS v4 + CSS global.

No se renderizan templates Django para la UI principal; el backend expone APIs REST y el frontend consume esos endpoints.

## Comandos

### Backend (ejecutar desde `backend/src/`)

```powershell
# Servidor de desarrollo (puerto 8000)
..\.venv\Scripts\python.exe manage.py runserver

# Tests
..\.venv\Scripts\python.exe manage.py test
..\.venv\Scripts\python.exe manage.py test records
..\.venv\Scripts\python.exe manage.py test records.tests.FilmRecordAPITest

# Migraciones
..\.venv\Scripts\python.exe manage.py makemigrations
..\.venv\Scripts\python.exe manage.py migrate

# Seed de datos
..\.venv\Scripts\python.exe manage.py seed_roles
..\.venv\Scripts\python.exe manage.py seed_catalogs
..\.venv\Scripts\python.exe manage.py seed_demo_data
```

### Frontend (ejecutar desde `frontend/`)

```powershell
npm start
npm run build
npm test
```

### Documentación de API

- Swagger principal: `http://localhost:8000/swagger/`
- Swagger alternativo (schema): `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

## Arquitectura

### Backend (`backend/src/`)

Patrón general por app: `models → serializers → views (ViewSets/APIs) → urls`.

| App | Responsabilidad |
|-----|------------------|
| `config/` | Settings, URL root, configuración DRF/Spectacular |
| `core/` | Base model compartido (`TimeStampedModel`) |
| `assets/` | Sistemas CCTV, servidores, cámaras, equipamiento, unidades |
| `novedades/` | Novedades operativas |
| `personnel/` | Gestión de personal |
| `records/` | Registros fílmicos, reportes de integridad, informes de análisis de video, IA |
| `hechos/` | Bitácora operativa (hechos/eventos) |

#### Endpoints principales expuestos bajo `/api/`

- `api/systems/`
- `api/servers/`
- `api/cameras/`
- `api/cameraman-gear/`
- `api/units/`
- `api/people/`
- `api/novedades/`
- `api/hechos/`
- `api/film-records/`
- `api/catalogs/`
- `api/integrity-check/`
- `api/integrity-summary-report/`
- `api/video-analysis-report/`
- `api/video-analysis-improve-text/`

#### Informes e IA (backend)

`records/services.py` centraliza la lógica de integridad e IA mediante `IntegrityService`:

- construcción de texto fallback para informe,
- mejora textual asistida por IA,
- generación de reportes (integridad/informe),
- anexos de fotogramas en base64.

Límites actuales (en `config/settings.py`):

- `VIDEO_REPORT_MAX_FRAMES = 30`
- `VIDEO_REPORT_MAX_FRAME_SIZE_BYTES = 8 * 1024 * 1024`
- `VIDEO_REPORT_MAX_TOTAL_BYTES = 80 * 1024 * 1024`

Configuración IA por entorno (`backend/.env`), tomando base en `backend/.env.example`:

- `GEMINI_API_KEY`
- `OPEN_ROUTER_API_KEY`
- `GROQ_API_KEY`
- `AI_TEXT_PROVIDER_ORDER`
- `AI_TEXT_PROVIDER_SELECTION`
- `AI_TEXT_FALLBACK_MODE`
- `AI_TEXT_TIMEOUT_SECONDS`
- `AI_TEXT_GEMINI_API_URL`
- `AI_TEXT_GEMINI_MODEL`
- `AI_TEXT_OPENROUTER_API_URL`
- `AI_TEXT_OPENROUTER_MODEL`
- `AI_TEXT_GROQ_API_URL`
- `AI_TEXT_GROQ_MODEL`

Nota: `settings.py` carga `.env` con `_load_local_env_file()` (sin `python-dotenv`).

### Frontend (`frontend/src/app/`)

Rutas SPA reales (`app.routes.ts`):

- `/`
- `/assets`
- `/novedades`
- `/personnel`
- `/records`
- `/hechos`
- `/integrity`
- `/informes`
- `/settings`

Mapa ruta → consumo de API:

| Ruta | Página | APIs principales |
|------|--------|------------------|
| `/` | Dashboard | Lecturas agregadas desde módulos operativos |
| `/assets` | Equipamiento | `api/systems`, `api/servers`, `api/cameras`, `api/cameraman-gear`, `api/units` |
| `/novedades` | Novedades | `api/novedades` |
| `/personnel` | Personal | `api/people` |
| `/records` | Registros fílmicos | `api/film-records`, `api/catalogs` |
| `/hechos` | Bitácora | `api/hechos` |
| `/integrity` | Verificación de integridad | Hash local + `api/integrity-summary-report` (y `api/integrity-check` cuando aplica) |
| `/informes` | Generador de informes | `api/video-analysis-improve-text` (y endpoint disponible `api/video-analysis-report`) |
| `/settings` | Configuración | Vista activa enrutada |

## Flujo de Informes: Integridad y Autenticidad del Material

En `Informes`, el flujo esperado de carga es:

1. Formato del archivo exportado.
2. Método de autenticidad.
3. Configuración de hash.

Contratos/tipos relevantes actuales (`informe.service.ts`):

- `VideoReportExportFormat`: `mp4|avi|mkv|mov|asf|dav|jpg|png|zip|otro`
- `VideoReportHashAlgorithm`: `sha1|sha3|sha256|sha512|otro`
- `VideoReportVmsAuthenticityMode`: `vms_propio|hash_preventivo|sin_autenticacion|otro`

Reglas de negocio actuales documentadas:

- `export_file_format` es obligatorio.
- Si `export_file_format = otro`, `export_file_format_other` es obligatorio.
- `vms_authenticity_mode` es obligatorio.
- Si `vms_authenticity_mode = otro`, `vms_authenticity_detail` es obligatorio.
- Si `vms_authenticity_mode = hash_preventivo`:
  - se requiere al menos un algoritmo de hash,
  - `hash_program` se autocompleta con `HashMyFiles` si está vacío.
- Si se selecciona algoritmo `otro`, `hash_algorithm_other` es obligatorio.

Casos típicos:

- `vms_propio`: autenticación por VMS (ej. Milestone/Avigilon).
- `hash_preventivo`: autenticación por hash externo (default `HashMyFiles`).
- `otro`: requiere detalle explícito.

Salida del informe:

- la UI genera un `.doc` local en frontend,
- la mejora textual IA se ejecuta vía backend (`api/video-analysis-improve-text`).

## UI y Estilo Global

Patrón visual vigente:

- Angular standalone.
- Tailwind CSS v4.
- Reglas globales en `frontend/src/styles.css`.

Lineamientos importantes:

- existe modo compacto global aplicado desde shell: `ui-compact`,
- reutilizar utilidades globales para tablas/acciones (por ejemplo `table-head-cell`, `table-body-cell`, `table-action-btn`),
- evitar estilos inline ad hoc; priorizar clases Tailwind y utilidades globales,
- mantener consistencia entre vistas (tipografía, densidad, botones de acción y jerarquía visual).

## Patrones y Convenciones

### Serializers y payloads

- Mantener campos de visualización (`*_name`, `*_full_name`) junto a FK ids cuando corresponda.
- No asumir nested writable serializers salvo implementación explícita.

### Servicios frontend

- `ApiService` es wrapper HTTP base para llamadas estándar.
- Excepción aceptada en servicios puntuales donde se requiere `HttpClient` directo para `Blob`, `FormData` o respuestas especiales.

### Convenciones de código

- Commits con prefijos de intención (`Add:`, `Fix:`, `Refactor:`, etc.).
- Frontend con Prettier (100 chars, single quotes).
- Backend bajo estilo Django/PEP8.

## Known Caveats

1. Playwright MCP puede fallar por sesión bloqueada (`Browser is already in use`) o `Transport closed`.
2. Si Playwright MCP está inestable, usar fallback de smoke visual con navegador MCP alternativo para validar navegación/render sin bloquear la tarea.
3. En validaciones E2E de tablas extensas (ej. `records` en mobile), contemplar scroll horizontal para verificar acciones.
