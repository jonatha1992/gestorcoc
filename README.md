# GestorCOC

Sistema integral de gestión para Centros de Operaciones y Control (COC) — gestión de sistemas CCTV, personal, novedades operativas, bitácora de hechos y registros fílmicos con análisis de integridad.

## Descripcion

GestorCOC es una aplicación web con arquitectura desacoplada (API REST + SPA), diseñada para la gestión centralizada de:

- Inventario de sistemas CCTV y camaras (jerarquía Unidad → Sistema → Servidor → Camara)
- Novedades operativas (fallas, eventos)
- Bitacora operativa (Hechos)
- Registros filmicos y solicitudes de evidencia
- Informes de integridad de archivos (hash SHA-1/3/256/512)
- Informes de analisis de video con mejora via IA
- Equipamiento del camarografo
- Personal del COC
- Dashboard con KPIs y mapa georreferenciado

## Arquitectura

```
gestorcoc/
├── backend/              # Django 5.2 + DRF
│   ├── config/           # Settings, URL root, DRF/Spectacular config
│   ├── core/             # TimeStampedModel + comando seed_data
│   ├── assets/           # Unidades, sistemas, servidores, camaras, equipamiento
│   ├── novedades/        # Novedades operativas
│   ├── hechos/           # Bitacora operativa
│   ├── records/          # Registros filmicos, informes, IA, dashboard
│   ├── personnel/        # Personal del COC
│   ├── .venv/            # Entorno virtual Python
│   └── manage.py
├── frontend/             # Angular 21 (standalone components) + Tailwind CSS v4
│   └── src/app/
│       ├── pages/
│       ├── components/
│       └── services/
└── docs/                 # Documentacion de arquitectura anterior (referencia historica)
```

El backend expone unicamente APIs REST. El frontend compilado es servido por WhiteNoise desde el mismo proceso Django.

## Tecnologias

### Backend

- **Framework:** Django 5.2 + Django REST Framework
- **Base de datos:** SQLite (desarrollo) / PostgreSQL (produccion via `DATABASE_URL`)
- **API docs:** drf-spectacular (Swagger + ReDoc)
- **IA:** Gemini, OpenRouter, Groq, Ollama (configurable via `.env`)
- **Deploy:** Railway (Gunicorn + WhiteNoise)

### Frontend

- **Framework:** Angular 21 (standalone components)
- **Estilos:** Tailwind CSS v4
- **HTTP Client:** Angular HttpClient + ApiService wrapper

## Instalacion

### Prerequisitos

- Python 3.11+
- Node.js 20+

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

# Seed de datos demo (opcional)
.venv\Scripts\python.exe manage.py seed_data
# Opciones: --mode [reset|fill_missing|append]  --volume [low|medium|high]  --dry-run

# Iniciar servidor de desarrollo (puerto 8000)
.venv\Scripts\python.exe manage.py runserver
```

Variables de entorno: copiar `backend/.env.example` a `backend/.env` y configurar.

### Frontend

```bash
cd frontend
npm install
npm start          # dev server en :4200, proxy a :8000
npm run build
```

## Rutas SPA

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/` | Dashboard | KPIs, graficos, mapa de unidades |
| `/assets` | Equipamiento | Sistemas, servidores, camaras, equipo camarografo |
| `/novedades` | Novedades | Fallas y eventos operativos |
| `/personnel` | Personal | Personal del COC |
| `/records` | Registros filmicos | Solicitudes de evidencia con CREV |
| `/hechos` | Bitacora | Registro de hechos operativos |
| `/integrity` | Integridad | Verificacion de hash de archivos |
| `/informes` | Informes | Generador de informes de analisis de video |
| `/settings` | Configuracion | — |

## Documentacion de API

- Swagger: `http://localhost:8000/swagger/` o `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`
- Health check: `http://localhost:8000/api/health/`

## Testing

```bash
# Backend (solo records/ tiene suites reales)
cd backend
.venv\Scripts\python.exe manage.py test records
.venv\Scripts\python.exe manage.py test records.tests.FilmRecordAPITest

# Frontend
cd frontend
npm test
```

## Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios siguiendo Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`
4. Push a la rama y abre un Pull Request

## Autor

**Jonathan** - [@jonatha1992](https://github.com/jonatha1992)

---

**Version:** 2.0.0
**Ultima actualizacion:** Marzo 2026
