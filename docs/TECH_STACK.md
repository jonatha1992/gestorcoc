# 🛠️ Stack Tecnológico

## Resumen
Tecnologías utilizadas en la versión Django del Sistema CREV (SSR, MVT).

---

## 📊 Visión General
| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Runtime | Python | 3.11.5+ |
| Framework | Django | 5.2.x |
| Templates | Django Template Language | nativo |
| Estilos | Tailwind CSS | CDN (v3/v4-compatible) |
| Base de Datos | SQLite (dev) / PostgreSQL (target) | ORM |
| Testing | Django TestCase | incluido |

---

## 🖥️ Backend (Django)
- **Apps**: `core` (auth/roles/catálogos), `inventory` (equipos/cámaras), `documents` (mesa de entrada/registros), `operations` (hechos), `utilities` (hash tool).
- **Permisos**: JSON de permisos por rol (module/actions) consumido por mixins y tags de template.
- **Migraciones**: `python manage.py migrate`.
- **Seeds**: `seed_roles`, `seed_catalogs`, `seed_demo_data` (opcional dev).

### Dependencias Python (principales)
```txt
Django>=5.0,<6.0
```

---

## 🎨 Frontend (SSR)
- **Templates**: DTL con layout `base.html` + `partials/sidebar.html`.
- **Tailwind**: importado por CDN, sin build step.
- **Interactividad**: JavaScript ligero solo donde sea necesario (no frameworks SPA).

---

## 🔒 Seguridad
- Autenticación y sesiones nativas de Django.
- CSRF habilitado en formularios.
- Hash de contraseñas estándar Django (PBKDF2 por defecto).
- Permisos por módulo/acción (RBAC) con `ModulePermissionRequiredMixin` y tag `{% has_permission %}`.

---

## 🧪 Testing
- **Comando**: `python manage.py test`
- **Cobertura**: smoke de auth/home, inventario, documentos con adjuntos, registros fílmicos, hechos y hash tool.

---

## 🚀 Compatibilidad y Despliegue
- Python 3.11.5+.
- Servir estáticos con `collectstatic` si se usa servidor externo; media en `/media` (adjuntos).
- Variables recomendadas: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_DEBUG=false` en prod.
