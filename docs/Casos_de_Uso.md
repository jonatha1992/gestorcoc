# Casos de Uso - GestorCOC

> Diagramas PlantUML: [`casos_uso.puml`](./casos_uso.puml) | [`secuencia_filmrecord.puml`](./secuencia_filmrecord.puml) | [`secuencia_integridad.puml`](./secuencia_integridad.puml)

## Actores

| Actor | Rol en sistema | Permisos clave |
|-------|---------------|----------------|
| **Operador COC** | `OPERADOR` | Carga de novedades, hechos, registros filmicos |
| **Fiscalizador CREV** | `SUPERVISOR` | Verificacion CREV de registros, acceso total de lectura |
| **Administrador** | `ADMIN` | Configuracion, ABM de usuarios y activos |

---

## UC-01: Reportar Novedad de Equipo

**Actor**: Operador COC / Fiscalizador CREV
**Objetivo**: Registrar una falla o evento tecnico sobre un activo.

**Flujo Principal**:
1. El usuario navega a `/novedades` y crea una nueva novedad.
2. Selecciona el activo afectado (camara, sistema, servidor o equipamiento).
3. Ingresa descripcion, tipo de incidente y severidad (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`).
4. (Opcional) Ingresa el ID de ticket externo DGT/CCO en `external_ticket_id`.
5. El sistema guarda con estado `OPEN`.

**Endpoint**: `POST /api/novedades/`

**Reglas de negocio**:
- El activo afectado es polimorfismo via FK nullable (camera, system, server o cameraman_gear).
- `reporter_name` puede usarse si el reportante no esta registrado como `Person`.

---

## UC-02: Seguimiento y Cierre de Novedad

**Actor**: Operador COC / Fiscalizador CREV
**Objetivo**: Actualizar estado de una novedad hasta su cierre.

**Flujo**:
1. Usuario accede a la lista de novedades (filtrable por severidad y estado).
2. Cambia el estado: `OPEN` → `IN_PROGRESS` → `CLOSED`.
3. (Opcional) Vincula el ticket externo de respuesta DGT.

**Endpoint**: `PATCH /api/novedades/{id}/`

---

## UC-03: Crear Registro Filmico

**Actor**: Operador COC
**Objetivo**: Iniciar la cadena de custodia para una extraccion de video solicitada.

**Flujo**:
1. El usuario navega a `/records` y crea un nuevo registro.
2. Ingresa datos de la solicitud: tipo (`OFICIO`/`NOTA`/`EXHORTO`), numero, solicitante.
3. Ingresa datos judiciales: numero de causa, caratula, tipo de delito.
4. Selecciona la camara involucrada y el rango temporal (`start_time` / `end_time`).
5. Asigna el operador que ejecuta la extraccion.
6. El sistema guarda con estado `PENDIENTE`.

**Endpoint**: `POST /api/film-records/`

---

## UC-04: Registrar Backup y Hash de Evidencia

**Actor**: Operador COC
**Precondicion**: El registro filmico existe en estado `PENDIENTE`.

**Flujo**:
1. El usuario edita el registro filmico.
2. Ingresa la ruta fisica del backup (`backup_path`).
3. Calcula y registra el hash del archivo (`file_hash`, `hash_algorithm`).
   - El hash puede calcularse localmente en el browser desde `/integrity`.
4. Marca `has_backup = True`.
5. El estado queda listo para verificacion CREV.

**Endpoint**: `PATCH /api/film-records/{id}/`
**Endpoint auxiliar**: `POST /api/integrity-check/` (calculo de hash server-side)

---

## UC-05: Verificacion CREV de Registro Filmico

**Actor**: Fiscalizador CREV (`SUPERVISOR`)
**Objetivo**: Certificar la integridad de la evidencia antes de su entrega.

**Flujo**:
1. El CREV accede a registros con backup registrado.
2. Ejecuta la accion `verify_by_crev`.
3. El sistema:
   - Asigna `verified_by_crev` al `Person` con rol `SUPERVISOR`.
   - Registra `verification_date` con la fecha actual.
   - Setea `is_editable = False` automaticamente (lock del registro).
4. El CREV puede descargar el **Certificado de Verificacion** en PDF.

**Endpoints**:
- `POST /api/film-records/{id}/verify_by_crev/`
- `GET /api/film-records/{id}/verification_certificate/`

**Regla de negocio**: Solo usuarios con `role = SUPERVISOR` pueden verificar.

---

## UC-06: Verificacion Local de Integridad de Archivo

**Actor**: Operador COC / Fiscalizador CREV
**Objetivo**: Calcular el hash de un archivo localmente para comparar con el registrado.

**Flujo**:
1. El usuario navega a `/integrity`.
2. Sube uno o mas archivos.
3. El sistema calcula el hash en el browser (SHA-256, SHA-512, SHA-3).
4. El usuario compara el hash resultado con el registrado en el sistema.
5. (Opcional) Genera un informe PDF resumen con todos los hashes.

**Frontend**: `HashService` — calculo local en el browser sin subir el archivo.
**Endpoint de informe**: `POST /api/integrity-summary-report/`

---

## UC-07: Generar Informe de Analisis de Video

**Actor**: Operador COC / Fiscalizador CREV
**Objetivo**: Producir un documento DOCX formal de analisis de video con mejora IA.

**Flujo**:
1. El usuario navega a `/informes` y completa el wizard.
2. Ingresa datos del informe: numero, fecha, formato de exportacion, modo de autenticidad VMS.
3. Si el modo es `hash_preventivo`, debe especificar al menos un algoritmo de hash.
4. (Opcional) Solicita mejora del texto descriptivo via IA.
5. El sistema genera el DOCX y lo descarga.

**Endpoints**:
- `POST /api/video-analysis-improve-text/` — mejora textual via IA
- `POST /api/video-analysis-report/` — genera el DOCX

**Reglas**:
- `export_file_format` obligatorio; si es `otro` → `export_file_format_other` obligatorio.
- `vms_authenticity_mode` obligatorio; si es `otro` → `vms_authenticity_detail` obligatorio.
- Si `hash_preventivo`: `hash_program` se autocompleta con `HashMyFiles`.

---

## UC-08: Registrar Hecho Operativo

**Actor**: Operador COC
**Objetivo**: Documentar un hecho policial u operativo observado desde el COC.

**Flujo**:
1. El usuario navega a `/hechos` y crea un nuevo hecho.
2. Ingresa: fecha/hora, categoria, descripcion, sector, grupos intervinientes.
3. (Opcional) Vincula la camara desde la que se observo el hecho.
4. Indica si se genero causa, si hubo intervencion COC, si se resolvio.

**Endpoint**: `POST /api/hechos/`
**Categorias**: `POLICIAL` / `OPERATIVO` / `INFORMATIVO` / `RELEVAMIENTO`

---

## UC-09: Dashboard y KPIs

**Actor**: Cualquier usuario
**Objetivo**: Obtener vision operacional del estado del sistema.

**Flujo**:
1. El usuario accede a `/` (dashboard).
2. Ve conteos y graficas por modulo con filtros de fecha.
3. Ve el mapa georreferenciado con unidades y sus conteos.

**Endpoints**:
- `GET /api/dashboard/novedades/`
- `GET /api/dashboard/hechos/`
- `GET /api/dashboard/records/`
- `GET /api/dashboard/personnel/`
- `GET /api/dashboard/map/`
- `GET /api/dashboard-stats/`
- `GET /api/ai-usage-daily/`
