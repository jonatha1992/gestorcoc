# GestorCOC — Planning y Estado del Proyecto

> Última actualización: 2026-03-07

---

## Estado General

| Capa | Estado |
| ------ | -------- |
| Backend API (Django + DRF) | Completo y estable |
| Base de datos (PostgreSQL Railway) | Migrada y con datos seed |
| Frontend SPA (Angular 21) | Funcional, con módulos en distintos estados |
| Autenticación | Pendiente (última etapa) |
| Deploy (Railway) | Activo |

---

## Módulos — Estado detallado

### Backend

| App | Modelos | API | Filtros/Búsqueda | Tests |
| ----- | --------- | ----- | ----------------- | ------- |
| `assets` | ✅ | ✅ | ✅ | ❌ |
| `novedades` | ✅ | ✅ | ✅ | ❌ |
| `hechos` | ✅ | ✅ | ✅ | ❌ |
| `personnel` | ✅ | ✅ | ✅ | ❌ |
| `records` | ✅ | ✅ | ✅ | ✅ (33 tests) |
| Dashboard / Map | ✅ | ✅ | ✅ | ❌ |
| IA (Gemini/OpenRouter/Groq) | ✅ | ✅ | — | ❌ |

### Frontend (por página)

| Ruta | Funcionalidad base | Paginación | Filtros en cabecera | Observaciones |
| ------ | -------------------- | ----------- | --------------------- | --------------- |
| `/` — Dashboard | ✅ | — | ✅ | Mapa: datos OK, sin renderizado visual de mapa |
| `/assets` | ✅ | ❌ | ❌ | Sin paginación visual ni filtros en encabezado |
| `/novedades` | ✅ | ✅ | ✅ | Completo |
| `/hechos` | ✅ | ✅ | ✅ | Completo |
| `/records` | ✅ | ✅ | ✅ (parcial) | Filtros de cabecera implementados; sin botón de informe integrado en tabla |
| `/personnel` | ✅ | ❌ | ❌ | Roles corregidos; sin paginación visual |
| `/integrity` | ✅ | — | — | Hash local + reporte PDF funcionando |
| `/informes` | ✅ | — | — | Generación DOCX + mejora IA funcionando |
| `/settings` | ❌ | — | — | Página vacía, sin contenido |

---

## Pendientes por prioridad

### ALTA — Funcionalidades faltantes visibles

| # | Tarea | Módulo | Detalle |
| --- | ------- | -------- | --------- |
| 1 | Paginación y filtros de cabecera en `/assets` | Frontend | Igual al patrón de Novedades/Hechos |
| 2 | Paginación y filtros de cabecera en `/personnel` | Frontend | Backend ya tiene filtros; falta UI |
| 3 | Mapa operacional interactivo en Dashboard | Frontend | API `dashboard/map/` ya devuelve puntos; falta renderizar con librería de mapas |
| 4 | Página `/settings` con contenido real | Frontend | Configuración de usuario, preferencias del sistema |

### MEDIA — Mejoras de calidad

| # | Tarea | Módulo | Detalle |
| --- | ------- | -------- | --------- |
| 5 | Tests unitarios para `assets`, `novedades`, `hechos`, `personnel` | Backend | Solo `records/` tiene tests reales |
| 6 | Botón "Generar Informe" integrado en tabla de records | Frontend | Actualmente en página separada `/informes` |
| 7 | `informes.ts` — suscripciones sin `takeUntil` | Frontend | Riesgo de memory leak en navegación |
| 8 | Export a Excel desde tablas (records, novedades) | Frontend | Backend devuelve datos; falta botón de descarga |
| 9 | `role_display` en tabla de personal | Frontend | Backend ya lo devuelve; mostrar etiqueta legible en lugar del código |

### BAJA — Deuda técnica conocida

| # | Tarea | Módulo | Detalle |
| --- | ------- | -------- | --------- |
| 10 | `HASH_ALGORITHM_CHOICES` en 3 lugares | Backend | Extraer constante en `records/models.py` |
| 11 | Serializers de assets con `fields = '__all__'` | Backend | Cambiar a listas explícitas |
| 12 | Tests pre-existentes fallando | Backend | `test_improves_text_fields` (mock signature) y `test_generates_docx_without_mock` (config AI en test env) |

### ÚLTIMA ETAPA — Autenticación

Decisiones de diseño ya acordadas:

- **Vínculo `Person` ↔ `User`**: `OneToOneField` nullable en `Person` → así hay personas sin cuenta de sistema (ej: personal archivado o externo)
- **Login**: username + password clásico de Django (no email)
- **Tokens**: JWT con refresh token via `djangorestframework-simplejwt`
- **Permisos iniciales**: cualquier usuario autenticado ve todo; solo se restringe CREV (ADMIN) que ya existe
- **Actualmente**: todos los endpoints son públicos (sin `DEFAULT_PERMISSION_CLASSES` en DRF), sin pantalla de login

| # | Tarea | Detalle |
| --- | ------- | --------- |
| 13 | JWT login en SPA | `djangorestframework-simplejwt` en backend + pantalla login + AuthGuard + HttpInterceptor en Angular |
| 14 | Permisos por rol en API | Restringir endpoints según `ADMIN / OP_EXTRACTION / OP_CONTROL / OP_VIEWER` |
| 15 | Vincular `Person` con `auth.User` | `OneToOneField` nullable `Person.user`; migración + serializer + seed actualizado |
| 16 | Pantalla `/settings` | Datos del usuario logueado, cambio de contraseña |

---

## Infraestructura actual

| Componente | Valor |
| ------------ | ------- |
| Backend hosting | Railway (PostgreSQL + Django) |
| Base de datos | PostgreSQL (Railway) |
| Frontend | Servido por WhiteNoise desde el mismo proceso Django |
| Variables de entorno | `.env` local / Railway env vars en producción |
| Proveedores IA | Gemini (primario), OpenRouter, Groq (fallback) |
| Usuarios Django | `admin`, `admin_coc`, `supervisor1`, `operador1`, `operador2` |

---

## Datos en producción (seed medium — 2026-03-07)

| Entidad | Cantidad |
| --------- | ---------- |
| Unidades | 6 |
| Sistemas | 5 |
| Servidores | 12 |
| Cámaras | 60 (51 online / 9 offline) |
| Equipamiento camarógrafo | 20 |
| Personal | 20 |
| Registros fílmicos | 90 (61 verificados con CREV) |
| Novedades | 60 |
| Hechos | 150 |

---

## Historial de cambios relevantes

| Fecha | Cambio |
| ------- | -------- |
| 2026-03-05 | Implementación de paginación server-side en Novedades y Hechos |
| 2026-03-06 | Auditoría general: roles corregidos, migraciones sincronizadas, código muerto eliminado, bug `Camera` en DashboardMapView resuelto |
| 2026-03-07 | Usuarios Django creados; documento de planning generado |
