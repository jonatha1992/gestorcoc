# GestorCOC

Sistema integral de gestion para Centros de Operaciones y Control (COC): sistemas CCTV, personal, novedades operativas, bitacora de hechos y registros filmicos con analisis de integridad.

## Descripcion

GestorCOC es una aplicacion web con arquitectura SPA + API REST, pero desplegada como una sola aplicacion same-origin: Angular se compila dentro de la imagen Docker y Django/WhiteNoise sirve el build final desde el mismo servidor.

La aplicacion centraliza:

- Inventario de sistemas CCTV y camaras (jerarquia Unidad -> Sistema -> Servidor -> Camara)
- Novedades operativas
- Bitacora operativa
- Registros filmicos y solicitudes de evidencia
- Informes de integridad de archivos (hash SHA-1/3/256/512)
- Informes de analisis de video con mejora via IA
- Equipamiento del camarografo
- Personal del COC
- Dashboard con KPIs y mapa georreferenciado

## Arquitectura

```text
gestorcoc/
|-- backend/              # Django 5.2 + DRF + JWT
|   |-- config/           # Settings, URL root, DRF/Spectacular config
|   |-- core/             # TimeStampedModel + comandos seed
|   |-- assets/           # Unidades, sistemas, servidores, camaras, equipamiento
|   |-- novedades/        # Novedades operativas
|   |-- hechos/           # Bitacora operativa
|   |-- records/          # Registros filmicos, informes, IA, dashboard
|   |-- personnel/        # Personal, auth y roles
|   |-- .venv/            # Entorno virtual Python
|   `-- manage.py
|-- frontend/             # Angular 21 (standalone components) + Tailwind CSS v4
|   `-- src/app/
`-- docs/                 # Documentacion y runbooks
```

El frontend de produccion se sirve desde Django en las mismas rutas del sitio. `frontend/src/environments/environment.production.ts` usa `apiUrl: ''`, por lo que la SPA consume `/api/...` sobre el mismo host.

## Tecnologias

### Backend

- **Framework:** Django 5.2 + Django REST Framework
- **Base de datos:** PostgreSQL para desarrollo local, tests y produccion
- **Autenticación:** JWT con `djangorestframework-simplejwt`
- **API docs:** drf-spectacular (Swagger + ReDoc)
- **IA:** Gemini, OpenRouter, Groq, Ollama (configurable via `.env`)
- **Deploy:** Railway (Gunicorn + WhiteNoise)

### Frontend

- **Framework:** Angular 21 (standalone components)
- **Estilos:** Tailwind CSS v4
- **HTTP Client:** Angular HttpClient + interceptor JWT

## Instalacion

### Prerequisitos

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ para todos los entornos

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Migraciones
.venv\Scripts\python.exe manage.py migrate

# Seed de datos demo para dev
.venv\Scripts\python.exe manage.py seed_data --volume low

# Usuarios base del sistema
.venv\Scripts\python.exe manage.py seed_system_users

# Iniciar servidor de desarrollo (puerto 8000)
.venv\Scripts\python.exe manage.py runserver
```

Variables de entorno: copiar `backend/.env.example` a `backend/.env` y configurar.

Base de datos:

- Desarrollo local: `DATABASE_URL=postgresql://...@127.0.0.1:5432/gestorcoc`
- Produccion: `DATABASE_URL=...`
- Integracion/test env: `DATABASE_URL=...`
- Tests: siempre PostgreSQL con `DATABASE_URL=...`
- SQLite ya no se usa en este proyecto
- Bootstrap recomendado en `dev`: `migrate` -> `seed_data --volume low` -> `seed_system_users`
- Password temporal por defecto en `dev` para usuarios seed: `Temp123456!`
- Con `DEBUG=False`, `seed_system_users` exige `SYSTEM_USERS_DEFAULT_PASSWORD` o `SYSTEM_USER_PASSWORD_<USUARIO>` y ya no usa fallback implicito

### Frontend

```bash
cd frontend
npm install
npm start          # dev server opcional en :4200 para desarrollo UI
npm run build
```

En Railway y en Docker el frontend no se sirve con `ng serve`: Angular se builda y Django/WhiteNoise entrega la SPA desde `/`.

## Rutas SPA

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/login` | Login | Inicio de sesion con JWT |
| `/` | Dashboard | KPIs, graficos, mapa de unidades |
| `/assets` | Equipamiento | Sistemas, servidores, camaras, equipo camarografo |
| `/novedades` | Novedades | Fallas y eventos operativos |
| `/personnel` | Personal | Personal del COC |
| `/records` | Registros filmicos | Solicitudes de evidencia con CREV |
| `/hechos` | Bitacora | Registro de hechos operativos |
| `/integrity` | Integridad | Verificacion de hash de archivos |
| `/informes` | Informes | Generador de informes de analisis de video |
| `/settings` | Configuración | Perfil y cambio de contraseña |

## Documentacion de API

- Swagger: `http://localhost:8000/swagger/` o `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`
- Health check: `http://localhost:8000/api/health/`
- Auth: `POST /api/auth/login/`, `POST /api/auth/refresh/`, `GET /api/auth/me/`

## Testing

```bash
# Backend
cd backend
.venv\Scripts\python.exe manage.py runserver

# Tests
$env:DATABASE_URL='postgresql://postgres:password@127.0.0.1:5432/gestorcoc_test'
.venv\Scripts\python.exe manage.py test personnel.tests
.venv\Scripts\python.exe manage.py test records.tests

# Frontend
cd frontend
npm test
```

## Autor

**Jonathan** - [@jonatha1992](https://github.com/jonatha1992)

---

**Version:** 2.1.0
**Ultima actualizacion:** Marzo 2026
