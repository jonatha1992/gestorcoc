# 📋 Planning y Roadmap

## Estado Actual del Proyecto

**Versión:** 0.1.0 (Django SSR)  
**Última Actualización:** Enero 2025

---

## ✅ Funcionalidades Implementadas

### Equipamiento
- [x] CRUD de equipos (Django)
- [x] Estados de equipo
- [x] Índices y auditoría básica

### Registros Fílmicos
- [x] CRUD de registros
- [x] Estados de registro
- [x] Campos de información judicial

### Infraestructura
- [x] Django 5 SSR (MVT)
- [x] Tailwind via CDN
- [x] RBAC por módulo/acción
- [x] Seeds de roles, catálogos e inicial demo
- [x] Smoke tests (`manage.py test`)

---

## 🚀 Roadmap por Fases

> [!IMPORTANT]
> **Orden recomendado:** Completar Fase 0 antes de agregar nuevas funcionalidades para evitar retrabajo.

### Fase 0: Base Obligatoria
*Antes de seguir creciendo*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Autenticación Django + sesiones | Alta | Completo |
| 2 | Roles/Permisos (RBAC) | Alta | Completo |
| 3 | Seeds de catálogos + ítems base | Alta | Completo |
| 4 | ABM Maestros (catálogos + items) | Alta | Completo |
| 5 | Auditoría (created/updated by/at) | Alta | Completo |

---

### Fase 1: Control de Cámaras
*Nuevo módulo completo*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 6 | CRUD de Cámaras | Alta | Completo |
| 7 | Novedades por cámara + historial | Alta | Pendiente |
| 8 | Tablero de cámaras con falla | Media | Pendiente |

---

### Fase 2: Jerarquía + Calidad
*Mejoras estructurales*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 9 | Jerarquía de catálogos (ubicaciones, categorías) | Media | Completo |
| 10 | Optimizar filtros con índices y select_related | Media | Completo |
| 11 | Historial de cambios (auditoría extendida) | Baja | Pendiente |
| 12 | Modelo de usuarios/roles por Sistema CCTV | Alta | Pendiente |
| 13 | Campos extra en Sistemas (vendor/tipo/version) y flag COC | Alta | Pendiente |
| 14 | Vincular Hechos a Sistema/Cámara (FK opcional) | Alta | Pendiente |
| 15 | Asegurar que Registros filminos referencien Sistema COC | Alta | Pendiente |

---

### Fase 3: Extras Planificados
*Funcionalidades complementarias*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 12 | Exportación Excel para registros | Media | Pendiente |
| 13 | Sistema de códigos QR | Media | Pendiente |
| 14 | Dashboard con estadísticas | Baja | Pendiente |
| 15 | Filtros avanzados (estado, fecha) | Media | Pendiente |
| 16 | Búsqueda global | Media | Pendiente |

---

## 📋 Checklist de Implementación

### Nuevas Pantallas (UI)
- [x] Cámaras: Listado
- [x] Cámaras: Alta/Edición
- [ ] Cámaras: Novedades
- [x] Maestros: Catálogos
- [x] Maestros: Ítems de catálogo
- [x] Seguridad: Usuarios
- [x] Seguridad: Roles/Permisos

### Servicios / Vistas Django
- [x] Vistas CRUD cámaras/equipos
- [x] Vistas CRUD catálogos/ítems
- [x] Vistas CRUD usuarios/roles
- [ ] Vistas novedades de cámara
- [ ] Dashboard cámaras con falla
- [ ] Gestión de usuarios/perfiles por sistema CCTV

### Modelos
- [x] `Camera`
- [x] `CameraUpdate`
- [x] `Catalog`
- [x] `CatalogItem`
- [x] `User`
- [x] `Role`
- [x] `Permission`

### Base de Datos
- [x] Migraciones Django listas
- [x] Índices en campos de filtrado
- [x] Campos de auditoría en entidades
- [ ] Extender `CctvSystem` con vendor/tipo/version/flag COC
- [ ] Extender `Hecho` con FK a sistema/cámara
- [ ] Crear modelo de usuarios/roles por sistema CCTV
- [ ] Forzar `FilmRecord` a vincular `org_system` cuando aplique

---

## 📝 Notas de Diseño

> [!WARNING]
> **No romper el histórico:** Guardar siempre IDs de catálogo (ej: `locationId`) y no el texto. Si cambia el nombre de una opción, no cambia el histórico.

### Convenciones
- Código PEP 8, UI en español.
- Templates heredan de `base.html`; permisos en mixins + tag `{% has_permission %}`.
- Adjuntos de documentos en `/media/docs/%Y/%m/`.

### Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
```
