# Modelo de Datos - GestorCOC

> Base de datos relacional. Desarrollo: SQLite. Producción: PostgreSQL.
> Todos los modelos heredan de `TimeStampedModel`.

---

## 1. Diagrama Entidad-Relación (DER)

> Diagramas PlantUML: [`modelo_datos.puml`](./diagrams/modelo_datos.puml) | [`jerarquia_activos.puml`](./diagrams/jerarquia_activos.puml)

---

## 2. Diccionario de Datos Clave

### `Unit` (Unidades / Aeropuertos)
- `code`: ID único (ej: AEP, EZE).
- `parent`: Relación jerárquica (Unidad superior).
- `map_enabled`: Visibilidad en Dashboard.

### `Person` (Personal Interno)
- `badge_number`: Legajo exacto de 6 dígitos.
- `role`: `ADMIN`, `OP_EXTRACTION`, `OP_CONTROL`, `OP_VIEWER`.
- `rank`: Jerarquía policial (Oficial, Inspector, etc.) o Civil.

### `FilmRecord` (Registros Fílmicos)
- `judicial_case_number`: Indexado para búsquedas rápidas.
- `file_hash`: Huella SHA-1/256/512.
- `delivery_status`: `PENDIENTE`, `ENTREGADO`, `DERIVADO`, `FINALIZADO`, `ANULADO`.
- `is_editable`: Se bloquea (`False`) tras la verificación del Administrador.
- `operator`: Texto libre descriptivo del responsable.

### `Hecho` (Bitácora Operativa)
- `category`: `POLICIAL`, `OPERATIVO`, `INFORMATIVO`, `RELEVAMIENTO`.
- `camera`: Vínculo opcional a la cámara de origen.

### `AIUsageLog` (Registro de IA)
- Monitorea el consumo de tokens por proveedor (Gemini, Groq, OpenRouter).

---

## 3. Campos de Legado
Se mantienen `reporter_name` (en Novedad) y `assigned_to_name` (en Gear) para preservar datos históricos previos a la implementación de relaciones con la tabla `Person`.
