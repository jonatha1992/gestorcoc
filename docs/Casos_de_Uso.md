# Especificación de Casos de Uso - GestorCOC v2.0

## UC-01: Reportar Novedad de Equipo

**Actor**: Operador COC
**Objetivo**: Informar una falla técnica y actualizar el estado del activo.

**Flujo Principal**:
1.  El usuario accede al **Inventario**.
2.  Busca el dispositivo (Cámara/NVR) por Nombre, IP o QR.
3.  Selecciona "Reportar Novedad".
4.  El sistema muestra el formulario `FR-NOV-01`.
5.  El usuario selecciona el tipo de falla (ej: "Sin Video").
6.  **(Opcional)** El usuario marca "Requiere Soporte Externo" -> Se genera borrador de email.
7.  El sistema guarda la novedad.
8.  **Automático**: El Estado de la Cámara pasa a "CON FALLA".

## UC-02: Gestionar Ticket Externo (Integración)

**Actor**: Operador COC / CREV
**Precondición**: Existe una Novedad (`UC-01`) que requiere soporte DGT.

**Flujo Principal**:
1.  El usuario recibe respuesta por email de DGT con un número de ticket (ej: "T-999").
2.  Accede a la Novedad pendiente en el sistema.
3.  Ingresa "T-999" en el campo `Ticket Externo`.
4.  El sistema vincula el registro interno con el proceso externo.

## UC-03: Alta de Solicitud de Evidencia

**Actor**: Operador COC / CREV
**Objetivo**: Iniciar la cadena de custodia para una extracción de video.

**Flujo Principal**:
1.  El usuario crea un nuevo `Film_Request`.
2.  Ingresa datos legales (Nro Causa, Fiscal solicitante).
3.  Selecciona del inventario las **Cámaras vinculadas** al hecho.
4.  El sistema genera un ID de Solicitud (ej: `REQ-FILM-2026-005`).
5.  Estado inicial: "Pendiente de Extracción".

## UC-04: Registrar Backup y Hash

**Actor**: Operador COC
**Precondición**: El video ya fue extraído al storage.

**Flujo Principal**:
1.  El usuario accede a una Solicitud (`UC-03`) en estado "En Proceso".
2.  Ingresa la ruta física del archivo (`/mnt/storage/...`).
3.  El sistema calcula (o el usuario ingresa) el **Hash SHA-256** del archivo.
4.  El usuario confirma el registro.
5.  El estado pasa a "Pendiente de Verificación".

## UC-05: Certificar Evidencia

**Actor**: Fiscalizador CREV
**Objetivo**: Validar que el archivo en disco no fue alterado.

**Flujo Principal**:
1.  El Fiscalizador accede a solicitudes "Pendientes de Verificación".
2.  Ejecuta la acción "Verificar Integridad".
3.  El sistema recalcula el Hash del archivo en la ruta física.
4.  **Si coincide**: El sistema marca el registro como "VERIFICADO" y emite el Certificado.
5.  **Si no coincide**: Alerta crítica de integridad rota.

## UC-06: Control de Acceso Físico

**Actor**: Guardia / Operador COC

**Flujo Principal**:
1.  Persona se presenta en puerta.
2.  Operador busca DNI en el sistema (`FR-ACC-02`).
3.  **Si existe y está habilitado**:
    *   Registra "Ingreso".
    *   Timer de permanencia inicia.
4.  **Si es visita nueva**:
    *   Carga datos básicos.
    *   Asigna anfitrión.
    *   Registra "Ingreso".
