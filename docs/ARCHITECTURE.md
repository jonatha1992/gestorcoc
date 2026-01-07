# 🏗️ Arquitectura del Sistema - Django

## Visión General
- **Patrón**: Monolito Django 5.x (SSR, MVT).
- **Apps**: `core` (auth/roles/catálogos), `inventory` (equipos/cámaras), `documents` (mesa de entrada/registros fílmicos), `operations` (hechos), `utilities` (hash tool).
- **Templates**: DTL con Tailwind vía CDN. Layout único `base.html` + `partials/sidebar.html` con control de permisos.
- **DB**: SQLite por defecto, ORM listo para PostgreSQL. Índices en campos de filtrado frecuente (`status`, `estado`, `fecha_ingreso`, `nro_orden`, `fecha_intervencion`, `reference_number`).

## Flujo de Peticiones
1) `urls.py` raíz incluye URLs de cada app.  
2) Permisos en vistas con `ModulePermissionRequiredMixin` y en templates con `{% has_permission %}`.  
3) Templates heredan de `base.html`; el sidebar se muestra solo con sesión iniciada.  
4) Adjuntos de documentos se guardan en `DocumentAttachment` (`/media/docs/%Y/%m/`).  
5) Hash Tool procesa archivos en memoria calculando MD5/SHA256.

## Estructura de Carpetas
```
crev/               # config
core/               # usuarios, roles, catálogos, organización
inventory/          # equipos, cámaras, novedades de cámara
documents/          # documentos y registros fílmicos
operations/         # hechos/incidentes
utilities/          # utilidades (hash tool)
templates/          # base + vistas por app
static/             # estáticos adicionales (opcional)
```

## Modelos Clave (resumen)
- `User` extiende `AbstractUser` con `roles` y `org_groups`.
- `Role` con `permissions` (module/actions) y flag `is_system`.
- `Catalog`/`CatalogItem` para listas maestras (ubicaciones, categorías, estados, tipos).
- `Equipment`, `EquipmentRegister`, `EquipmentRegisterItem`, `Camera`, `CameraUpdate`, `CameraInventoryRecord` (inventario).
- `Document`, `DocumentAttachment`, `FilmRecord` (mesa de entrada y registros).
- `Hecho` (novedades/operaciones).

## Seeds y Datos Iniciales
- `python manage.py seed_roles`: roles admin/turno_crev/turno_coc con permisos por módulo.
- `python manage.py seed_catalogs`: catálogos base + ítems.
- `python manage.py seed_demo_data`: crea admin demo, unidad CREV Central, sistema principal, equipo, cámara, expediente, registro fílmico y hecho de ejemplo.
- `python manage.py import_inventory_files`: importa planillas ANEXO VI y CSV de cámaras (informacion/*.xlsx, informacion/*.csv, data/*.csv).

## Seguridad y Permisos
- Autenticación nativa Django (sesiones).  
- Permisos por módulo/acción en roles (`permissions` JSON) consumidos por mixin y tag de plantilla.  
- CSRF activo en formularios.  
- Hash de contraseñas estándar Django (PBKDF2 por defecto).

## Testing
- Suite smoke con Django TestCase (`python manage.py test`): login/home stats, CRUD equipos/cámaras, documentos con adjuntos, registros fílmicos, hechos y hash tool.

## Despliegue y Config
- Variables recomendadas: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_DEBUG=false` en producción.
- Migraciones vía `python manage.py migrate` en CI/CD.
- Archivos subidos en `/media`; servir con web server front (nginx) en prod.
