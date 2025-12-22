# 📋 Planning y Roadmap

## Estado Actual del Proyecto

**Versión:** 0.0.0 (Desarrollo)  
**Última Actualización:** Diciembre 2024

---

## ✅ Funcionalidades Implementadas

### Equipamiento
- [x] CRUD completo de equipos
- [x] Estados de equipo
- [x] Integración con Firestore

### Registros Fílmicos
- [x] CRUD completo de registros
- [x] Estados de registro
- [x] Campos de información judicial

### Infraestructura
- [x] Angular 21 standalone
- [x] Firebase (Firestore)
- [x] Tailwind CSS v4
- [x] Responsive design

---

## 🚀 Roadmap por Fases

> [!IMPORTANT]
> **Orden recomendado:** Completar Fase 0 antes de agregar nuevas funcionalidades para evitar retrabajo.

### Fase 0: Base Obligatoria
*Antes de seguir creciendo*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Autenticación real (Email/Password) | Alta | Pendiente |
| 2 | Roles/Permisos (RBAC) | Alta | Pendiente |
| 3 | Reglas Firestore por rol | Alta | Pendiente |
| 4 | ABM Maestros (catálogos + items) | Alta | Pendiente |
| 5 | Migrar combos existentes a catálogos | Alta | Pendiente |

---

### Fase 1: Control de Cámaras
*Nuevo módulo completo*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 6 | CRUD de Cámaras | Alta | Pendiente |
| 7 | Novedades por cámara + historial | Alta | Pendiente |
| 8 | Tablero de cámaras con falla | Media | Pendiente |

---

### Fase 2: Jerarquía + Calidad
*Mejoras estructurales*

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 9 | Jerarquía de catálogos (ubicaciones, categorías) | Media | Pendiente |
| 10 | Auditoría (createdBy, updatedBy) | Media | Pendiente |
| 11 | Historial de cambios | Baja | Pendiente |

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
- [ ] Cámaras: Listado
- [ ] Cámaras: Alta/Edición
- [ ] Cámaras: Novedades
- [ ] Maestros: Catálogos
- [ ] Maestros: Ítems de catálogo
- [ ] Seguridad: Usuarios
- [ ] Seguridad: Roles/Permisos

### Nuevos Servicios
- [ ] `camera.service`
- [ ] `camera-update.service`
- [ ] `catalog.service`
- [ ] `auth.service`
- [ ] Guards de rol/permiso

### Nuevos Modelos
- [ ] `Camera`
- [ ] `CameraUpdate`
- [ ] `Catalog`
- [ ] `CatalogItem`
- [ ] `User`
- [ ] `Role`
- [ ] `Permission`

### Firestore
- [ ] Crear colecciones nuevas
- [ ] Definir reglas por rol
- [ ] Campos de auditoría en todas las entidades

---

## 📝 Notas de Diseño

> [!WARNING]
> **No romper el histórico:** Guardar siempre IDs de catálogo (ej: `locationId`) y no el texto. Si cambia el nombre de una opción, no cambia el histórico.

### Convenciones
- Archivos sin sufijo `.component`
- Usar `inject()` para DI
- Nombres en kebab-case

### Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
```
