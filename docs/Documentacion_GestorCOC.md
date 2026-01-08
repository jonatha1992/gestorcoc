# Documentación del Sistema GestorCOC v2.0

> **Documento de Requisitos**: Este documento consolida la Especificación de Requisitos de Software (SRS) e Ingeniería de Requisitos del Sistema GestorCOC v2.0. Es agnóstico de tecnología y puede implementarse en cualquier plataforma.

---

## Índice

1. [Introducción y Alcance](#1-introducción-y-alcance)
2. [Ingeniería de Requisitos](#2-ingeniería-de-requisitos)
3. [Requisitos Funcionales del Sistema](#3-requisitos-funcionales-del-sistema)
4. [Requisitos No Funcionales](#4-requisitos-no-funcionales)
5. [Matriz de Trazabilidad](#5-matriz-de-trazabilidad)
6. [Modelo de Datos Conceptual](#6-modelo-de-datos-conceptual)
7. [Relaciones Operativas CCTV/COC](#7-relaciones-operativas-cctvcoc)

---

# 1. Introducción y Alcance

## 1.1 Propósito

Este documento define formal y exhaustivamente los requisitos funcionales y no funcionales para la versión 2.0 del **Sistema GestorCOC**. Sirve como contrato de alcance entre los stakeholders y el equipo de desarrollo.

El sistema centraliza la gestión técnica de cámaras, salas COC y el flujo administrativo de expedientes/solicitudes.

## 1.2 Alcance del Producto

El Sistema **GestorCOC** es una plataforma web centralizada diseñada para optimizar las operaciones diarias de los Centros de Operaciones y Control (COC). El sistema abarcará:

1. **Gestión de Novedades Técnicas**: Registro de incidentes de hardware/software (Cámaras/VMS) para estadística y auditoría técnica.
2. **Mesa de Entrada (Expedientes)**: Trazabilidad completa de documentación oficial (Entradas/Salidas).
3. **Inventario Técnico (VMS)**: Control de activos de videovigilancia (Servidores, Equipos y Cámaras).
4. **Registros Fílmicos**: Gestión de solicitudes de evidencia digital del COC con trazabilidad de backups.
5. **Utilidades de Integridad**: Herramientas criptográficas para validación de evidencia digital.
6. **Módulo de Hechos (COC)**: Registro y seguimiento de intervenciones operativas.
7. **Gestión de Personal COC**: Registro de dotación, ingresos/egresos y control de acceso del personal.
8. **Requerimientos de Capacitación y Equipamiento**: Gestión de necesidades de cursos y equipamiento para el personal operativo.
9. **Control de Acceso al COC**: Listado de personas autorizadas y registro de ingresos/egresos físicos a las instalaciones.
10. **Sistema de Tickets/Solicitudes**: Generación de pedidos de COC/CREV hacia CEAC, DGT o CCO con seguimiento y trazabilidad.

El sistema operará como una aplicación web centralizada accesible desde navegadores modernos.

## 1.3 Glosario Técnico

| Término | Definición |
|---------|------------|
| **SRS** | Software Requirements Specification (Especificación de Requisitos de Software) |
| **RBAC** | Role-Based Access Control (Control de Acceso Basado en Roles) |
| **VMS** | Video Management System |
| **KPI** | Key Performance Indicator (Indicadores de desempeño) |
| **Mesa de Entrada** | Módulo de gestión documental |
| **Novedad Técnica** | Registro de falla o cambio en equipamiento |
| **COC** | Sala de Centro de Operaciones y Control (asociada a una Unidad) |
| **Hecho** | Registro de intervención operativa en el COC |
| **CEAC** | Centro de Emergencias Alto Comando (nivel superior de administración) |
| **CREV** | Centro de Recepción y Evaluación de Video (fiscalización) |

## 1.4 Estructura Organizacional Jerárquica

```
┌─────────────────────────────────────────────────────────────────────┐
│  ESTRUCTURA JERÁRQUICA INTERNA                                     │
│                                                                     │
│  ADMIN (Superusuario del Sistema)                                   │
│  • Configuración global, gestión de usuarios, auditoría             │
│  │                                                                  │
│  └──► CEAC (Alto Comando / Supervisión General)                    │
│       • Supervisión de todo el sistema operativo                    │
│       • Reportes consolidados, métricas globales                    │
│       │                                                             │
│       └──► CREV (Centro de Monitoreo / Fiscalización)              │
│            • Fiscaliza múltiples unidades COC                       │
│            • Gestiona: Mesa de Entrada, Inventario                  │
│            • Aprueba/rechaza requerimientos de COC                  │
│            │                                                        │
│            └──► COC (Unidades Operativas)                          │
│                 • Operadores de guardia por turnos                  │
│                 • Cargan: Hechos, Novedades, Registros              │
│                 • Solicitan: Cursos, Equipamiento, Tickets          │
│                 • Solo acceso a SU unidad                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ÁREAS EXTERNAS (Sin acceso al sistema)                            │
│                                                                     │
│  ● DGT (Dirección de Gestión Tecnológica)                         │
│    • Aprobación final de requerimientos de equipamiento/cursos    │
│    • Gestión de recursos técnicos y capacitación                │
│    • RECIBE: Notificaciones email de requerimientos y tickets     │
│    • RESPONDE: Genera tickets/solicitudes hacia CEAC/CREV/COC     │
│      (en respuesta a requerimientos recibidos)                    │
│    • NO tiene usuarios ni acceso al sistema                       │
│                                                                     │
│  ● CCO (Centro de Control Operativo)                              │
│    • Coordinación operativa general                             │
│    • RECIBE: Notificaciones email de tickets                      │
│    • RESPONDE: Genera tickets/solicitudes hacia CEAC/CREV/COC     │
│      (en respuesta a consultas recibidas)                         │
│    • NO tiene usuarios ni acceso al sistema                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.5 Roles y Permisos por Módulo

| Clase de Usuario | Nivel Jerárquico | Responsabilidades | Alcance |
|------------------|------------------|-------------------|---------|
| **Administrador** | Sistema | Configuración global, gestión usuarios, auditoría | Todo el sistema |
| **DGT** | Dirección Técnica | Aprobación final de requerimientos, gestión de recursos | Todo el sistema |
| **Supervisor (CEAC)** | Alto Comando | Supervisión general, reportes consolidados | Todo el sistema (lectura) |
| **Fiscalizador (CREV)** | Medio | Mesa de Entrada, Inventario, aprobación de requerimientos | Múltiples unidades asignadas |
| **Operador (COC)** | Operativo | Hechos, Novedades, Registros, solicitud de requerimientos | Solo su unidad |

### Áreas Externas (No tienen acceso al sistema)

> **Importante**: DGT y CCO son áreas externas que **NO tienen usuarios ni acceso al sistema**. La comunicación es **bidireccional** vía email u otros medios externos.

| Área Externa | Función | Interacción con el Sistema |
|--------------|---------|------------------------------|
| **DGT** (Dirección de Gestión Tecnológica) | Aprobación final de requerimientos, gestión de recursos técnicos | **RECIBE**: Email automático cuando CREV aprueba un requerimiento. **GENERA**: Su propio número de ticket (ej: DGT-2024-001) que envía en la respuesta. **SISTEMA**: Debe permitir registrar el número de ticket externo de DGT. |
| **CCO** (Centro de Control Operativo) | Coordinación operativa general | **RECIBE**: Email automático cuando se crea un ticket para CCO. **GENERA**: Su propio número de ticket (ej: CCO-2024-001) que envía en la respuesta. **SISTEMA**: Debe permitir registrar el número de ticket externo de CCO. |

### Matriz de Acceso por Módulo

| Módulo | Admin | CEAC | CREV | COC |
|--------|-------|------|------|-----|
| **Hechos** | ✅ CRUD global | 👁️ Lectura global | 👁️ Fiscaliza sus unidades | ✅ CRUD su unidad |
| **Novedades Cámaras** | ✅ CRUD global | 👁️ Lectura global | 👁️ Fiscaliza sus unidades | ✅ CRUD su unidad |
| **Registros Fílmicos** | ✅ CRUD global | 👁️ Lectura global | 👁️ Fiscaliza sus unidades | ✅ CRUD su unidad |
| **Inventario/Equipamiento** | ✅ CRUD global | 👁️ Lectura global | ✅ Gestiona y asigna | ✅ CRUD su unidad |
| **Usuarios CCTV** | ✅ CRUD global | 👁️ Lectura global | ✅ CRUD sus unidades | ✅ CRUD su unidad |
| **Personal COC** | ✅ CRUD global | 👁️ Lectura global | ✅ CRUD sus unidades | 👁️ Lectura su unidad |
| **Requerimientos Capacitación** | ✅ CRUD global | 👁️ Supervisa | ✅ Aprueba/Rechaza | ✅ Solicita |
| **Control de Acceso/Ingreso** | ✅ CRUD global | 👁️ Lectura global | ✅ ABM personas + 👁️ Ingresos/Egresos | ✅ ABM personas + Registra ingresos |
| **Sistema de Tickets** | ✅ CRUD global | ✅ Recibe/Responde | ✅ Crea/Recibe/Responde | ✅ Crea tickets |
| **Hash (Utilidades)** | ✅ Acceso | ✅ Acceso | ✅ Acceso | ✅ Acceso |
| **Mesa de Entrada** | ✅ CRUD global | ✅ CRUD | ❌ Sin acceso |
| **Configuración** | ✅ Acceso total | ❌ Sin acceso | ❌ Sin acceso | ❌ Sin acceso |

> **Nota sobre Control de Acceso**: 
> - **COC**: Gestiona personas autorizadas de su unidad y registra ingresos/egresos de su sala
> - **CREV**: Gestiona personas autorizadas de sus unidades supervisadas y **visualiza** todos los ingresos/egresos de esas unidades para supervisión
> - **CEAC**: Visualiza globalmente para supervisión general

### Modelo de Pertenencia

* **Usuario COC**: Pertenece a UNA `OrganizationalUnit` vía `user.org_unit`
  * Cada unidad tiene **grupos de guardia** (turnos: Mañana, Tarde, Noche) vía `OrganizationalGroup`
  * El operador pertenece a su grupo de guardia vía `user.org_groups`
* **Usuario CREV**: Fiscaliza MÚLTIPLES unidades vía `user.org_groups` → `OrganizationalGroup.units`
* **Usuario CEAC**: Acceso global (superuser) o vía grupos con todas las unidades

```
OrganizationalGroup (uso dual)
├── Grupos de Fiscalización CREV
│   └── units[] → [Unidad A, Unidad B, ...] (unidades a fiscalizar)
│
└── Grupos de Guardia COC (por unidad)
    └── units[] → [Mi Unidad] + role → turno_coc
```

## 1.6 Entorno Operativo

* **Servidor**: Compatible con sistemas operativos Windows Server o Linux
* **Cliente**: Navegadores Web Modernos (Chrome, Edge, Firefox)
* **Red**: Intranet Corporativa (LAN)

---

# 2. Ingeniería de Requisitos

## 2.1 Requisitos de Usuario (UR) - "Lo que el humano necesita"

| ID | Requisito |
|----|-----------|
| **UR-01** | El usuario debe poder ver en un solo vistazo si hay cámaras críticas caídas |
| **UR-02** | El personal técnico necesita que el sistema le avise si un expediente lleva más de 48hs sin gestión |
| **UR-03** | Se requiere que la carga de fallas de cámara sea posible desde un dispositivo móvil con interfaz táctil |
| **UR-04** | El responsable COC debe saber qué grupo resolvió un hecho y cuánto tardó en cerrarlo |
| **UR-05** | Cada usuario debe operar solo sobre su Unidad/COC y con permisos por módulo |

## 2.2 Requisitos de Interfaz de Usuario (UI)

* **UI-01**: El sistema implementará una barra lateral (Sidebar) persistente para la navegación principal
* **UI-02**: El diseño utilizará el framework **Tailwind CSS** para implementar un modo oscuro visual con efectos de transparencia ("Glassmorphism")
* **UI-03**: Las interacciones críticas (confirmaciones, modales) no deben requerir recarga completa de página (uso de JavaScript/HTMX)

## 2.3 Requisitos de Interfaz de Software

* **SI-01**: El sistema utilizará **SQLite 3** como motor de persistencia (migrable a PostgreSQL)
* **SI-02**: El sistema se comunicará con el sistema de archivos del servidor para el almacenamiento de adjuntos (`/media`)

---

# 3. Requisitos Funcionales del Sistema

## 3.1 Módulo de Autenticación y Seguridad (Core)

| ID | Requisito |
|----|-----------|
| **FR-AUTH-001** | El sistema debe permitir el acceso mediante credenciales (Usuario/Contraseña) validadas contra la base de datos local |
| **FR-AUTH-002** | El sistema debe cerrar automáticamente la sesión tras un periodo de inactividad configurable |
| **FR-AUTH-003** | El acceso a cada módulo debe estar restringido por los permisos asignados al rol del usuario |
| **FR-AUTH-004** | El sistema debe registrar un **log de auditoría** de todas las acciones críticas (crear, modificar, eliminar) con usuario, fecha/hora, IP y detalle del cambio |
| **FR-AUTH-005** | El log de auditoría debe ser consultable por administradores para fiscalizar el uso del sistema |

## 3.2 Módulo de Dashboards (Inteligencia de Negocio)

### Estructura de Dashboards

| ID | Requisito |
|----|-----------|
| **SR-DASH-01** | Existirá un **Dashboard Maestro** (Home) con resumen de KPIs críticos de todos los módulos |
| **SR-DASH-02** | El **Módulo de Hechos/Cámaras** tendrá su propio Dashboard detallado (Fallas por zona, Top cámaras fallidas, tiempos de resolución) |
| **SR-DASH-03** | El **Módulo de Mesa de Entrada** tendrá un Dashboard de gestión (Productividad, Tiempos de respuesta, expedientes pendientes) |
| **SR-DASH-04** | Cada dashboard mostrará solo los datos correspondientes al **alcance del usuario** según su rol y unidad |

### Filtrado por Rol y Unidad

| Rol | Datos que ve en Dashboard |
|-----|---------------------------|
| **Admin** | Todo el sistema sin filtros |
| **CEAC** | Todo el sistema (lectura) |
| **CREV** | Solo las unidades que tiene asignadas via `OrganizationalGroup.units` |
| **COC** | Solo su unidad (`user.org_unit`) |

### Exportación de Datos

| ID | Requisito |
|----|-----------|
| **SR-DASH-05** | Todos los dashboards deben permitir **exportar a Excel** (.xlsx) los datos visualizados |
| **SR-DASH-06** | Los reportes exportados deben respetar los filtros aplicados (fecha, unidad, estado) |
| **SR-DASH-07** | El archivo exportado debe incluir: fecha de generación, usuario que exportó, y filtros aplicados |

## 3.3 Módulo de Novedades Técnicas y Cámaras

| ID | Requisito |
|----|-----------|
| **FR-LOG-001** | El sistema debe permitir registrar eventos técnicos (ej: "Cámara sin video", "VMS reiniciado") con fines estadísticos y de mantenimiento |
| **FR-LOG-002** | El usuario debe poder adjuntar evidencias (imágenes/PDF) al registro del incidente |
| **FR-LOG-003** | El sistema debe generar indicadores de *Uptime* y *Tasa de Fallos* por **Cámara** y **VMS** |
| **SR-CAM-01** | Al dar de alta una novedad técnica, se debe poder filtrar la cámara por nombre o IP |
| **SR-CAM-02** | El sistema debe permitir adjuntar múltiples fotos de la falla técnica |
| **SR-CAM-03** | Las cámaras pertenecen a sistemas CCTV (Hikvision/Dahua, etc.) de una Unidad con o sin Sala COC |

## 3.4 Módulo de Hechos (COC)

| ID | Requisito |
|----|-----------|
| **SR-HEC-01** | Un Hecho se asocia a una Unidad (COC), sistema CCTV y cámara opcional |
| **SR-HEC-02** | Registrar grupo que resuelve y tiempos de resolución (inicio → cierre) |
| **SR-HEC-03** | Permitir estados Abierto/Cerrado, cálculo automático de minutos de resolución en reportes/dashboard |
| **SR-HEC-04** | Filtrar Hechos por Unidad, Sistema, Cámara, Estado y Grupo resolutor |
| **SR-HEC-05** | Los Hechos creados por COC deben tener estado **"Pendiente de Verificación"** hasta que CREV los apruebe |
| **SR-HEC-06** | CREV puede marcar un Hecho como **"Verificado"** o **"Rechazado"** con observaciones |
| **SR-HEC-07** | Dashboard de CREV debe mostrar cantidad de registros pendientes de verificación |

## 3.5 Módulo de Mesa de Entrada (Expedientes)

| ID | Requisito |
|----|-----------|
| **FR-DOC-001** | El sistema permitirá el ciclo de vida completo (Alta, Modificación, Cambio de Estado, Cierre) de expedientes |
| **FR-DOC-002** | El sistema debe sugerir o generar un número de referencia único si no es provisto |
| **FR-DOC-003** | El sistema proveerá filtros combinados por Fecha, Remitente, Destinatario y Estado |
| **SR-DOC-01** | El número de referencia/ticket es opcional; el sistema puede sugerirlo si no se ingresa |

## 3.6 Módulo de Inventario (VMS y Equipos)

| ID | Requisito |
|----|-----------|
| **FR-INV-001** | El sistema modelará la relación `1:N` entre Sistemas CCTV y Cámaras |
| **FR-INV-002** | Permitir marcar manualmente el estado operativo (Online/Offline/Mantenimiento) de cada cámara |
| **FR-INV-003** | Gestión de equipamiento con categorías, ubicaciones y estados |
| **FR-INV-004** | El sistema debe generar **códigos QR** únicos para cada equipo, permitiendo su identificación física mediante etiquetas |
| **FR-INV-005** | El escaneo del QR debe mostrar la información del equipo y permitir acceso rápido a su historial de novedades |

## 3.7 Módulo de Usuarios CCTV (Credenciales de Sistemas)

> Este módulo permite gestionar las cuentas de acceso a los sistemas VMS/NVR físicos. **NO son usuarios del sistema GestorCOC**.

| ID | Requisito |
|----|-----------|
| **FR-CCTV-001** | El sistema permitirá registrar usuarios/cuentas de cada sistema CCTV (VMS, NVR, DVR) |
| **FR-CCTV-002** | Cada cuenta debe indicar su nivel de acceso en el sistema CCTV (Admin, Operador, Visualizador) |
| **FR-CCTV-003** | Permitir asociar opcionalmente una cuenta CCTV a un usuario del sistema CREV |
| **FR-CCTV-004** | Registrar fecha de último cambio de contraseña para auditoría de seguridad |
| **FR-CCTV-005** | Generar alertas cuando una contraseña no se haya cambiado en X días (configurable) |
| **FR-CCTV-006** | Permitir consultar qué usuarios CREV tienen acceso a cada sistema CCTV |

## 3.8 Módulo de Utilidades

| ID | Requisito |
|----|-----------|
| **FR-UTIL-001** | El sistema proveerá una interfaz para calcular hash (MD5, SHA256) de archivos subidos, validando su integridad |

## 3.9 Módulo de Registros Fílmicos

> Este módulo gestiona las solicitudes de evidencia digital (video) del COC, con trazabilidad completa del backup realizado.

| ID | Requisito |
|----|-----------|
| **FR-FILM-001** | El sistema debe permitir registrar solicitudes de evidencia fílmica con número de asunto, orden, solicitante y causa judicial |
| **FR-FILM-002** | Cada registro debe asociarse a una Unidad y opcionalmente a un Sistema CCTV específico |
| **FR-FILM-003** | El sistema debe permitir indicar si se realizó backup del video (`has_backup`) |
| **FR-FILM-004** | Si se realizó backup, el sistema debe registrar: fecha/hora inicio (`backup_from_date`), fecha/hora fin (`backup_to_date`), ubicación del backup (`backup_location`) y tamaño en MB/GB (`backup_size_mb`) |
| **FR-FILM-005** | El sistema debe gestionar estados: Pendiente, En Proceso, Finalizado, Verificado |
| **FR-FILM-006** | CREV debe poder verificar los registros fílmicos, registrando usuario verificador, fecha y observaciones |
| **FR-FILM-007** | El sistema debe permitir filtrar por estado, unidad, tipo de solicitud, tipo de delito y rango de fechas |
| **FR-FILM-008** | El dashboard debe mostrar cantidad de registros pendientes de verificación |

## 3.10 Módulo de Requerimientos de Capacitación y Equipamiento

> Este módulo permite gestionar las necesidades de capacitación (cursos) y equipamiento del personal operativo de COC.

| ID | Requisito |
|----|-----------|
| **FR-REQ-001** | El sistema debe permitir registrar requerimientos de capacitación (cursos/entrenamientos) para el personal |
| **FR-REQ-002** | El sistema debe permitir registrar requerimientos de equipamiento (uniformes, equipos, herramientas) para el personal |
| **FR-REQ-003** | Cada requerimiento debe asociarse a una Unidad y opcionalmente a un empleado específico |
| **FR-REQ-004** | El sistema debe gestionar estados: Solicitado, Aprobado_CREV, Aprobado_DGT, En_Proceso, Completado, Rechazado |
| **FR-REQ-005** | El sistema debe implementar flujo de aprobación jerárquico: COC solicita → CREV aprueba/rechaza → DGT aprueba finalmente |
| **FR-REQ-006** | El sistema debe permitir indicar prioridad (Baja, Media, Alta, Urgente) |
| **FR-REQ-007** | El sistema debe registrar fechas: solicitud, aprobación CREV, aprobación DGT, completado |
| **FR-REQ-008** | El sistema debe permitir adjuntar documentación de respaldo (cotizaciones, programas de curso, etc.) |
| **FR-REQ-009** | El sistema debe generar reportes de requerimientos por unidad, tipo, estado y prioridad |
| **FR-REQ-010** | El dashboard debe mostrar cantidad de requerimientos pendientes por nivel de aprobación |
| **FR-REQ-011** | Para cursos: registrar nombre del curso, proveedor, duración estimada, cantidad de vacantes solicitadas |
| **FR-REQ-012** | Para equipamiento: registrar tipo de equipo, cantidad solicitada, especificaciones técnicas |
| **FR-REQ-013** | CREV puede agregar observaciones al aprobar/rechazar un requerimiento |
| **FR-REQ-014** | El sistema debe generar un borrador de email cuando un requerimiento es aprobado por CREV y destinado a DGT |
| **FR-REQ-015** | El borrador de email debe incluir: datos del requerimiento, justificación, documentación adjunta y espacio para que el usuario complete información adicional |
| **FR-REQ-016** | El usuario debe poder revisar, completar y enviar el email manualmente desde el sistema |
| **FR-REQ-017** | El sistema debe permitir registrar el número de ticket externo generado por DGT (ej: DGT-2024-001) cuando se recibe la respuesta |
| **FR-REQ-018** | El sistema debe permitir registrar manualmente la aprobación/rechazo de DGT con observaciones y costo aprobado |

## 3.11 Módulo de Gestión de Personal COC

> Este módulo permite llevar un registro de la dotación de personal en cada COC, con control de ingresos, egresos y datos del personal.

| ID | Requisito |
|----|-----------|
| **FR-PERS-001** | El sistema debe permitir registrar datos del personal: nombre completo, DNI, legajo, cargo/función |
| **FR-PERS-002** | Cada empleado debe asociarse a una Unidad (COC) y opcionalmente a un Grupo Organizacional (turno) |
| **FR-PERS-003** | El sistema debe registrar fecha de alta (ingreso) y opcionalmente fecha de baja (egreso) |
| **FR-PERS-004** | El sistema debe permitir indicar estado del empleado: Activo, Licencia, Suspendido, Desvinculado |
| **FR-PERS-005** | El sistema debe permitir registrar datos de contacto: teléfono, email, dirección |
| **FR-PERS-006** | El sistema debe permitir adjuntar documentación del personal (CV, certificados, autorizaciones de seguridad) |
| **FR-PERS-007** | El sistema debe generar reportes de dotación actual por unidad y turno |
| **FR-PERS-008** | El sistema debe permitir filtrar por unidad, estado, cargo, turno y rango de fechas de ingreso |
| **FR-PERS-009** | El sistema debe registrar historial de cambios de turno/unidad del empleado |
| **FR-PERS-010** | El dashboard debe mostrar cantidad de personal activo, licenciado y alertas de falta de personal |
| **FR-PERS-011** | El sistema debe permitir asociar un empleado a un usuario del sistema (opcional) para rastrear ingreso como operador |

## 3.12 Módulo de Control de Acceso al COC

> Este módulo gestiona el listado de personas autorizadas a ingresar físicamente a las instalaciones del COC y registra cada ingreso/egreso para control de seguridad.

| ID | Requisito |
|----|-----------|
| **FR-ACC-001** | El sistema debe permitir registrar personas autorizadas para ingresar al COC (empleados, visitas recurrentes, proveedores, autoridades) |
| **FR-ACC-002** | COC y CREV deben poder dar de alta, modificar y dar de baja personas autorizadas para sus respectivas unidades |
| **FR-ACC-003** | Cada persona autorizada debe tener: nombre completo, DNI, tipo de acceso, unidad autorizada, vigencia de autorización |
| **FR-ACC-004** | El sistema debe gestionar tipos de autorización: Permanente (empleados), Temporal (visitas), Proveedor, Autoridad |
| **FR-ACC-005** | El sistema debe permitir establecer vigencia de la autorización (fecha desde/hasta) |
| **FR-ACC-006** | El sistema debe registrar cada ingreso físico al COC: persona, fecha/hora ingreso, motivo |
| **FR-ACC-007** | El sistema debe registrar cada egreso físico del COC: persona, fecha/hora egreso |
| **FR-ACC-008** | El sistema debe calcular automáticamente el tiempo de permanencia (egreso - ingreso) |
| **FR-ACC-009** | El sistema debe permitir registrar a quién visita la persona (empleado anfitrión) |
| **FR-ACC-010** | El sistema debe generar reportes de: personas actualmente en el COC, historial de ingresos por fecha, tiempo promedio de visita |
| **FR-ACC-011** | El sistema debe alertar cuando una persona intenta ingresar sin autorización vigente |
| **FR-ACC-012** | El sistema debe permitir búsqueda rápida por DNI para registrar ingreso |
| **FR-ACC-013** | El sistema debe mostrar dashboard con: personas actualmente dentro, ingresos del día, autorizaciones por vencer |
| **FR-ACC-014** | COC solo puede gestionar personas autorizadas para su propia unidad |
| **FR-ACC-015** | CREV puede gestionar personas autorizadas para todas las unidades que supervisa |
| **FR-ACC-016** | CREV debe poder visualizar todos los ingresos/egresos de las unidades COC que supervisa en tiempo real |
| **FR-ACC-017** | El sistema debe permitir a CREV filtrar ingresos/egresos por unidad, fecha, tipo de persona y estado (dentro/fuera) |

## 3.13 Módulo de Sistema de Tickets/Solicitudes

> Este módulo permite a COC y CREV generar tickets/solicitudes dirigidas a diferentes áreas (CEAC, DGT, CCO) para pedidos de soporte, recursos, reparaciones, etc.

| ID | Requisito |
|----|-----------|
| **FR-TKT-001** | El sistema debe permitir crear tickets/solicitudes desde COC o CREV |
| **FR-TKT-002** | Cada ticket debe tener: número único, solicitante, área destinataria, asunto, descripción, prioridad |
| **FR-TKT-003** | El sistema debe permitir seleccionar área destinataria: CEAC, DGT (Dirección de Gestión Tecnológica), CCO (Centro de Control Operativo) |
| **FR-TKT-004** | El sistema debe generar automáticamente un número de ticket secuencial por año (ej: TKT-2024-0001) |
| **FR-TKT-005** | El sistema debe gestionar estados: Abierto, En_Proceso, Pendiente_Info, Resuelto, Cerrado, Cancelado |
| **FR-TKT-006** | El sistema debe permitir clasificar tickets por tipo: Soporte_Técnico, Solicitud_Recursos, Reparación, Consulta, Reclamo, Otros |
| **FR-TKT-007** | El sistema debe permitir asignar prioridad: Baja, Media, Alta, Crítica |
| **FR-TKT-008** | El sistema debe registrar fecha/hora de creación, asignación, resolución y cierre |
| **FR-TKT-009** | El sistema debe permitir adjuntar archivos al ticket (fotos, documentos, evidencias) |
| **FR-TKT-010** | El sistema debe permitir agregar comentarios/respuestas al ticket por ambas partes |
| **FR-TKT-011** | El sistema debe generar un borrador de email cuando se crea un ticket para áreas externas (DGT, CCO) |
| **FR-TKT-012** | El borrador de email debe incluir: número de ticket interno, asunto, descripción, prioridad, archivos adjuntos y espacio para información adicional |
| **FR-TKT-013** | El usuario debe poder revisar, completar y enviar el email manualmente desde el sistema |
| **FR-TKT-014** | El sistema debe permitir registrar el número de ticket externo generado por DGT/CCO (ej: DGT-2024-001, CCO-2024-001) |
| **FR-TKT-015** | El sistema debe permitir al área destinataria asignar el ticket a un responsable específico |
| **FR-TKT-016** | El sistema debe calcular automáticamente tiempo de respuesta y tiempo de resolución |
| **FR-TKT-017** | El sistema debe generar reportes de tickets por: área, estado, prioridad, tipo, tiempo promedio de resolución |
| **FR-TKT-018** | El dashboard debe mostrar: tickets abiertos, tickets críticos pendientes, tiempo promedio de resolución por área |
| **FR-TKT-019** | El sistema debe permitir buscar tickets por número interno o número de ticket externo (DGT/CCO) |
| **FR-TKT-020** | El sistema debe enviar alertas automáticas cuando un ticket crítico lleva más de X horas sin respuesta |
| **FR-TKT-021** | El sistema debe permitir vincular un ticket con otros registros del sistema (Hechos, Novedades, Equipamiento) |
| **FR-TKT-022** | Para áreas externas: el sistema debe permitir registrar manualmente las respuestas recibidas vía email |

---

# 4. Requisitos No Funcionales

## 4.1 Rendimiento

* **NFR-PERF-01**: El tiempo de respuesta del servidor para vistas estándar no debe exceder los 500ms
* **NFR-PERF-02**: Las consultas a base de datos deben estar optimizadas para evitar consultas múltiples innecesarias (problema N+1)

## 4.2 Seguridad

* **NFR-SEC-01**: Las contraseñas se almacenarán utilizando algoritmos de hash robustos (PBKDF2/Argon2)
* **NFR-SEC-02**: Protección contra ataques CSRF habilitada en todos los formularios

## 4.3 Mantenibilidad y Escalabilidad

* **NFR-MAINT-01**: El código debe seguir estándares de codificación definidos para el lenguaje utilizado
* **NFR-MAINT-02**: La estructura del proyecto debe separar responsabilidades en módulos bien definidos
* **NFR-SCAL-01**: El sistema debe ser capaz de migrar entre diferentes motores de base de datos sin cambios significativos en el código

---

# 5. Matriz de Trazabilidad

| Requerimiento Usuario | Requisito Funcional | Validación |
|-----------------------|------------------------|------------|
| UR-01 (Cámaras caídas) | Dashboard Maestro (SR-DASH-01, SR-DASH-02) | Test Visual |
| UR-02 (Alertas expedientes) | Alarmas de Expediente pendiente | Verificación Horaria |
| UR-03 (Carga móvil) | Diseño responsive (UI-02) | Test Mobile |
| UR-04 (Grupo y tiempo resolución) | Campos en Hecho (SR-HEC-02/03) | Reporte COC |
| UR-05 (Permisos por unidad) | Roles + Unidades en usuarios (FR-AUTH-003) | Prueba de permisos |

---

# 6. Relaciones Operativas CCTV/COC

## 6.1 Jerarquía Organizacional

```o v
CEAC (Administración Central)
│
└── CREV (Centro de Monitoreo y Fiscalización)
    │
    ├── Grupos de Turno (Mañana, Tarde, Noche)
    │   └── Unidades Supervisadas [Unidad A, Unidad B, ...]
    │
    └── COC / Unidades Operativas
        ├── Sala COC (opcional)
        ├── Sistemas CCTV (Hikvision, Dahua, etc.)
        │   └── Cámaras de Vigilancia
        ├── Equipamiento (NVR, VMS, switches, storage)
        ├── Hechos/Intervenciones Operativas
        └── Registros Fílmicos (Evidencia Digital)
```

## 6.2 Flujo de Trabajo por Rol

### Operador COC (Nivel Operativo)

1. **Inicio de turno**: Accede al sistema con su usuario asignado a una Unidad Organizacional
2. **Carga de Hechos**: Registra intervenciones operativas, asociando automáticamente a su unidad
3. **Novedades de Cámaras**: Reporta fallas/reparaciones de cámaras de su unidad
4. **Registros Fílmicos**: Gestiona solicitudes de evidencia digital de su unidad
5. **Control de Acceso**: Registra ingresos y egresos de personas a las instalaciones del COC

### Fiscalizador CREV (Nivel Supervisión)

1. **Monitoreo**: Visualiza dashboard consolidado de todas las unidades a su cargo
2. **Mesa de Entrada**: Gestiona documentación oficial (expedientes de entrada/salida)
3. **Inventario**: Administra equipamiento y cámaras de sus unidades supervisadas
4. **Fiscalización**: Revisa y verifica Hechos, Novedades y Registros creados por las unidades COC
5. **Gestión de Personal**: Administra dotación y requerimientos de las unidades

### Administrador CEAC (Nivel Global)

1. **Configuración**: Gestiona usuarios, roles, permisos y catálogos del sistema
2. **Auditoría**: Acceso completo a logs y reportes de auditoría de todo el sistema
3. **Reportes Consolidados**: Visualiza KPIs y métricas globales de todas las unidades
4. **Supervisión General**: Acceso de lectura a todos los módulos operativos

## 6.3 Reglas de Filtrado de Datos

### Por Rol

| Rol | Alcance de Datos | Descripción |
|-----|------------------|-------------|
| **COC** | Solo su unidad | Ve únicamente datos de la unidad a la que pertenece |
| **CREV** | Sus unidades supervisadas | Ve datos de todas las unidades que tiene asignadas en sus grupos |
| **CEAC** | Todo el sistema | Acceso global sin filtros |
| **Admin** | Todo el sistema | Acceso administrativo completo |

### Principios de Filtrado

* Los operadores COC solo pueden ver y modificar datos de su propia unidad organizacional
* Los fiscalizadores CREV ven datos agregados de las múltiples unidades que supervisan
* El sistema aplica filtrado automático basándose en la unidad del usuario y sus grupos asignados
* Las auditorías registran todas las operaciones con usuario, fecha/hora e IP de origen

---

> **Última actualización**: Enero 2026  
> **Versión**: 2.0  
> **Tipo**: Especificación de Requisitos de Software (SRS)
