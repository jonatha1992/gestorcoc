# Casos de Uso - GestorCOC

> Diagramas PlantUML: [`casos_uso.puml`](./diagrams/casos_uso.puml) | [`secuencia_filmrecord.puml`](./diagrams/secuencia_filmrecord.puml) | [`actividad_novedad.puml`](./diagrams/actividad_novedad.puml)

## Actores

| Actor | Rol en sistema | Descripción |
|-------|---------------|-------------|
| **Administrador** | `ADMIN` | Acceso total, gestión de usuarios, unidades y activos. |
| **Operador Básico** | `OP_EXTRACTION` | Extracción/Visualización, carga de registros fílmicos, auditoría. |
| **Operador de Cámaras** | `OP_CONTROL` | Gestión de domos/PTZ, reporte de hechos y novedades. |
| **Solo Visualización** | `OP_VIEWER` | Acceso de lectura a inventario y dashboards. |

---

## UC-01: Reportar Novedad de Equipo
**Actor**: ADMIN, OP_CONTROL, OP_EXTRACTION
**Objetivo**: Registrar una falla técnica sobre un activo (Cámara, Sistema, Servidor, Equipo).
**Estado**: `OPEN` → `IN_PROGRESS` → `CLOSED`.

## UC-02: Registrar Hecho Operativo (Bitácora)
**Actor**: ADMIN, OP_CONTROL, OP_EXTRACTION
**Objetivo**: Documentar eventos en tiempo real (Policial, Operativo, Informativo).
**Vínculo**: Se puede asociar a una cámara específica.

## UC-03: Gestión de Registros Fílmicos
**Actor**: OP_EXTRACTION, ADMIN
**Objetivo**: Trazabilidad de pedidos judiciales de video.
**Flujo**: Creación → Registro de Backup/Hash → Verificación CREV (Lock) → Certificado PDF.

## UC-04: Verificación de Integridad de Evidencia
**Actor**: ADMIN, OP_EXTRACTION
**Objetivo**: Confirmar que el archivo de video no ha sido alterado comparando hashes (local o server-side).

## UC-05: Generación de Informes con IA
**Actor**: OP_EXTRACTION, ADMIN
**Objetivo**: Crear documentos DOCX formales de análisis de video con asistencia de IA para mejorar la narrativa.

## UC-06: Dashboard Operacional y Mapa
**Actor**: Todos
**Objetivo**: Visualizar KPIs en tiempo real y estado geográfico de las unidades aeroportuarias.
