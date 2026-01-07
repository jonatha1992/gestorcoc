# Sistema de Gestión Integral CREV / COC

> Plataforma unificada de operaciones, documentación, inventario y registros fílmicos, construida como monolito Django (SSR).

## Visión rápida
- Django 5.x (MVT) con templates DTL + Tailwind vía CDN, sin build step de frontend.
- Apps principales: `core` (usuarios/roles/catálogos), `operations` (hechos/novedades), `documents` (mesa de entrada y registros fílmicos), `inventory` (equipamiento y cámaras), `utilities` (hash tool).
- Base de datos: SQLite en desarrollo; compatible con PostgreSQL a través del ORM.
- Control de acceso por roles (RBAC) con mixins y tags de permiso en vistas/plantillas.

## Módulos funcionales
- **Novedades / Hechos**: Libro de guardia técnico y operativo.
- **Mesa de Entrada**: Expedientes de entrada/salida con adjuntos y prioridades.
- **Inventario CCTV**: VMS, equipos y cámaras con estados y ubicaciones.
- **Registros fílmicos**: Solicitudes y trazabilidad de evidencia digital.
- **Utilidades**: Hash tool (MD5/SHA256) para validar archivos.
- **Dashboard**: Indicadores de novedades de cámaras y estado de expedientes.

## Stack y arquitectura
| Componente | Tecnología | Detalle |
| --- | --- | --- |
| Backend | Python 3.11+ / Django 5.x | SSR, MVT, ORM |
| Templates | Django Template Language | Layout `base.html` + `partials/sidebar.html` |
| Estilos | Tailwind CSS | Cargado por CDN |
| JS | Vanilla JS | Interactividad ligera |
| Datos | SQLite (dev) / PostgreSQL (prod) | `db.sqlite3` por defecto |

## Puesta en marcha (desarrollo)
1) Clonar y acceder al repo:
```bash
git clone <repo-url>
cd gestorcoc
```
2) Crear y activar entorno virtual (ejemplo Unix):
```bash
python -m venv .venv
source .venv/bin/activate
```
3) Instalar dependencias Python:
```bash
pip install -r requirements.txt
```
4) Variables recomendadas (ejemplo dev):
```bash
export DJANGO_SECRET_KEY=dev-only-change-me
export DJANGO_DEBUG=true
# export DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```
5) Migraciones y datos iniciales:
```bash
python manage.py migrate
python manage.py seed_roles
python manage.py seed_catalogs
python manage.py seed_demo_data  # opcional para datos de ejemplo (usa DJANGO_DEMO_ADMIN_PASSWORD o admin1234)
python manage.py createsuperuser  # si no usas seed_demo_data o queres otro admin
```
6) Ejecutar servidor:
```bash
python manage.py runserver
```

## Testing rápido
```bash
python manage.py test
```

## Notas útiles
- Archivos subidos se guardan en `media/`; los estáticos adicionales viven en `static/` y se sirven con `collectstatic` en despliegues productivos.
- Los comandos de seed son idempotentes; podés ejecutarlos para sincronizar catálogos/roles sin borrar datos existentes.
- Documentación ampliada en `docs/` (arquitectura, stack y requisitos del sistema).
