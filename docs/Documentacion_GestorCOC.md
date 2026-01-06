# Documentación del Sistema GestorCOC v2.0

> **Documento Unificado**: Este documento consolida la Especificación de Requisitos de Software (SRS), Ingeniería de Requisitos, Diseño de Base de Datos y Guía de Implementación Django. Puede exportarse a PDF o Word utilizando herramientas como Pandoc.

---

## Índice

1. [Introducción y Alcance](#1-introducción-y-alcance)
2. [Ingeniería de Requisitos](#2-ingeniería-de-requisitos)
3. [Requisitos Funcionales del Sistema](#3-requisitos-funcionales-del-sistema)
4. [Requisitos No Funcionales](#4-requisitos-no-funcionales)
5. [Matriz de Trazabilidad](#5-matriz-de-trazabilidad)
6. [Diseño de Base de Datos](#6-diseño-de-base-de-datos)
7. [Implementación Django 5.x](#7-implementación-django-5x)
8. [Relaciones Operativas CCTV/COC](#8-relaciones-operativas-cctvcoc)

---

# 1. Introducción y Alcance

## 1.1 Propósito

Este documento define formal y exhaustivamente los requisitos funcionales y no funcionales para la versión 2.0 del **Sistema GestorCOC**. Sirve como contrato de alcance entre los stakeholders y el equipo de desarrollo para la solución monolítica basada en **Django 5.x**.

El sistema centraliza la gestión técnica de cámaras, salas COC y el flujo administrativo de expedientes/solicitudes.

## 1.2 Alcance del Producto

El Sistema **GestorCOC** es una plataforma web centralizada diseñada para optimizar las operaciones diarias de los Centros de Operaciones y Control (COC). El sistema abarcará:

1. **Gestión de Novedades Técnicas**: Registro de incidentes de hardware/software (Cámaras/VMS) para estadística y auditoría técnica.
2. **Mesa de Entrada (Expedientes)**: Trazabilidad completa de documentación oficial (Entradas/Salidas).
3. **Inventario Técnico (VMS)**: Control de activos de videovigilancia (Servidores, Equipos y Cámaras).
4. **Registros Fílmicos**: Gestión de solicitudes de evidencia digital del COC.
5. **Utilidades de Integridad**: Herramientas criptográficas para validación de evidencia digital.
6. **Módulo de Hechos (COC)**: Registro y seguimiento de intervenciones operativas.

El sistema operará bajo una arquitectura **Monolítica (Server-Side Rendering)** utilizando **Django 5.x** y **SQLite** (con capacidad de migración transparente a PostgreSQL/MySQL).

## 1.3 Glosario Técnico

| Término | Definición |
|---------|------------|
| **SRS** | Software Requirements Specification (Especificación de Requisitos de Software) |
| **MVT** | Model-View-Template (Patrón de arquitectura de Django) |
| **DTL** | Django Template Language (Motor de plantillas nativo) |
| **SSR** | Server-Side Rendering (Renderizado en el servidor) |
| **RBAC** | Role-Based Access Control (Control de Acceso Basado en Roles) |
| **VMS** | Video Management System |
| **ORM** | Object-Relational Mapping (Abstracción de Base de Datos) |
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
│            │                                                        │
│            └──► COC (Unidades Operativas)                          │
│                 • Operadores de guardia por turnos                  │
│                 • Cargan: Hechos, Novedades, Registros Fílmicos    │
│                 • Solo acceso a SU unidad                           │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.5 Roles y Permisos por Módulo

| Clase de Usuario | Nivel Jerárquico | Responsabilidades | Alcance |
|------------------|------------------|-------------------|---------|
| **Administrador** | Sistema | Configuración global, gestión usuarios, auditoría | Todo el sistema |
| **Supervisor (CEAC)** | Alto Comando | Supervisión general, reportes consolidados | Todo el sistema (lectura) |
| **Fiscalizador (CREV)** | Medio | Mesa de Entrada, Inventario, supervisión | Múltiples unidades asignadas |
| **Operador (COC)** | Operativo | Hechos, Novedades Cámaras, Registros Fílmicos | Solo su unidad |

### Matriz de Acceso por Módulo

| Módulo | Admin | CEAC (Supervisor) | CREV (Fiscalizador) | COC (Operador) |
|--------|-------|-------------------|---------------------|----------------|
| **Hechos** | ✅ CRUD global | 👁️ Lectura global | 👁️ Fiscaliza sus unidades | ✅ CRUD su unidad |
| **Novedades Cámaras** | ✅ CRUD global | 👁️ Lectura global | 👁️ Fiscaliza sus unidades | ✅ CRUD su unidad |
| **Registros Fílmicos** | ✅ CRUD global | 👁️ Lectura global | 👁️ Fiscaliza sus unidades | ✅ CRUD su unidad |
| **Inventario/Equipamiento** | ✅ CRUD global | 👁️ Lectura global | ✅ Gestiona y asigna | ✅ CRUD su unidad |
| **Usuarios CCTV** | ✅ CRUD global | 👁️ Lectura global | ✅ CRUD sus unidades | ✅ CRUD su unidad |
| **Hash (Utilidades)** | ✅ Acceso | ✅ Acceso | ✅ Acceso | ✅ Acceso |
| **Mesa de Entrada** | ✅ CRUD global | 👁️ Lectura global | ✅ CRUD | ❌ Sin acceso |
| **Configuración** | ✅ Acceso total | ❌ Sin acceso | ❌ Sin acceso | ❌ Sin acceso |

> **Nota sobre Equipamiento**: CREV gestiona y asigna equipamiento a las unidades. COC puede gestionar el equipamiento de su propia unidad.
> **Nota sobre Usuarios CCTV**: CREV y COC pueden registrar usuarios de los sistemas CCTV de sus respectivas unidades.

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

* **Servidor de Aplicación**: Compatible con cualquier SO que soporte **Python 3.11.5+** (Windows Server / Linux)
* **Framework**: **Django 5.x** (SSR, MVT) con DTL + Tailwind (CDN)
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

---

# 4. Requisitos No Funcionales

## 4.1 Rendimiento

* **NFR-PERF-01**: El tiempo de respuesta del servidor para vistas estándar no debe exceder los 500ms
* **NFR-PERF-02**: Las consultas a base de datos deben estar optimizadas (`select_related`) para evitar el problema N+1

## 4.2 Seguridad

* **NFR-SEC-01**: Las contraseñas se almacenarán utilizando algoritmos de hash robustos (PBKDF2/Argon2)
* **NFR-SEC-02**: Protección contra ataques CSRF habilitada en todos los formularios

## 4.3 Mantenibilidad y Escalabilidad

* **NFR-MAINT-01**: El código debe seguir el estándar **PEP 8** de Python
* **NFR-MAINT-02**: La estructura del proyecto debe separar responsabilidades en "Apps" de Django
* **NFR-SCAL-01**: Todo acceso a datos debe ser vía Django ORM para garantizar migración futura a PostgreSQL/MySQL

---

# 5. Matriz de Trazabilidad

| Requerimiento Usuario | Implementación Técnica | Validación |
|-----------------------|------------------------|------------|
| UR-01 (Cámaras caídas) | Dashboard Maestro (SR-DASH-01, SR-DASH-02) | Test Visual |
| UR-02 (Alertas expedientes) | Alarmas de Expediente pendiente | Verificación Horaria |
| UR-03 (Carga móvil) | Tailwind Responsive (UI-02) | Test Mobile |
| UR-04 (Grupo y tiempo resolución) | Campos en Hecho (SR-HEC-02/03) | Reporte COC |
| UR-05 (Permisos por unidad) | Roles + Unidades en usuarios (FR-AUTH-003) | Prueba de permisos |

---

# 6. Diseño de Base de Datos

## 6.1 Diagrama de Modelos (Estado Actual)

### App: `core` - Usuarios, Roles y Organización

#### Role

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(50) | Nombre único del rol |
| `description` | TextField | Descripción del rol |
| `is_system` | BooleanField | Si es rol del sistema |
| `is_active` | BooleanField | Estado activo |
| `permissions` | JSONField | Lista de permisos asignados |
| `created_at` / `updated_at` | DateTime | Auditoría |

#### Catalog / CatalogItem

Catálogos dinámicos para: Categorías, Ubicaciones, Estados Equipo, Tipos Cámara, Tipos Solicitud, Tipos Delito, Unidades, Organismos.

#### AuditLog (NUEVO - Auditoría del Sistema)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | FK → User | Usuario que realizó la acción |
| `action` | Enum(CREATE, UPDATE, DELETE, LOGIN, LOGOUT) | Tipo de acción |
| `model_name` | CharField(100) | Modelo afectado (ej: "Hecho", "Equipment") |
| `object_id` | IntegerField | ID del objeto afectado |
| `object_repr` | CharField(255) | Representación legible del objeto |
| `changes` | JSONField | Detalle de cambios (antes/después) |
| `ip_address` | GenericIPAddress | IP del cliente |
| `user_agent` | CharField(255) | Navegador/dispositivo |
| `timestamp` | DateTimeField(auto_now_add) | Fecha y hora de la acción |

> **Nota**: El AuditLog se genera automáticamente mediante signals de Django para todas las operaciones CRUD en modelos críticos.

#### OrganizationalUnit

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(150) | Nombre de la unidad |
| `description` | TextField | Descripción |
| `has_coc` | BooleanField | Si tiene Sala COC |
| `created_by` | FK → User | Usuario creador |

#### CctvSystem

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `unit` | FK → OrganizationalUnit | Unidad a la que pertenece |
| `name` | CharField(150) | Nombre del sistema |
| `brand` | CharField(100) | Marca (Hikvision, Dahua, etc.) |
| `model` | CharField(100) | Modelo |
| `ip_address` | GenericIPAddress | Dirección IP |
| `location` | CharField(200) | Ubicación física |
| `is_coc_room` | BooleanField | Si es sistema de Sala COC |

#### CctvSystemUser (NUEVO - Usuarios de Sistemas CCTV)

> **Importante**: Este modelo NO es para autenticación en el sistema GestorCOC. Es para **registrar y gestionar las credenciales** de acceso a los sistemas CCTV físicos (VMS, NVR, DVR) de cada unidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cctv_system` | FK → CctvSystem | Sistema CCTV al que pertenece esta cuenta |
| `username` | CharField(100) | Nombre de usuario en el sistema CCTV |
| `role_in_system` | Enum(ADMIN, OPERATOR, VIEWER) | Nivel de acceso en el sistema CCTV |
| `assigned_to` | FK → User (nullable) | Usuario GestorCOC que usa esta cuenta (opcional) |
| `description` | TextField | Descripción o propósito de la cuenta |
| `password_hint` | CharField(100) | Pista de contraseña (NO la contraseña real) |
| `is_active` | BooleanField | Si la cuenta está activa |
| `last_password_change` | DateField | Última vez que se cambió la contraseña |
| `created_at` / `updated_at` | DateTime | Auditoría |

**Casos de uso:**

* Inventariar todas las cuentas de acceso a cada sistema CCTV
* Saber quién tiene acceso a qué sistema
* Registrar cuándo se cambiaron las contraseñas
* Auditar qué usuarios GestorCOC están asignados a qué cuentas de sistema

#### OrganizationalGroup

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(150) | Nombre del grupo |
| `units` | M2M → OrganizationalUnit | Unidades asociadas |
| `systems` | M2M → CctvSystem | Sistemas asociados |
| `role` | FK → Role | Rol asociado |

#### User (extiende AbstractUser)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `display_name` | CharField(150) | Nombre para mostrar |
| `roles` | M2M → Role | Roles asignados |
| `org_groups` | M2M → OrganizationalGroup | Grupos organizacionales |
| `org_unit` | FK → OrganizationalUnit | Unidad principal |

---

### App: `inventory` - Equipamiento y Cámaras

#### Equipment

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(200) | Nombre del equipo |
| `category` | FK → CatalogItem | Categoría |
| `location` | FK → CatalogItem | Ubicación |
| `parent_equipment` | FK → self | Equipo contenedor |
| `serial_number` | CharField(120) | Número de serie |
| `brand` / `model` | CharField(120) | Marca y modelo |
| `status` | Enum(Disponible, En Reparacion, Entregado, Baja) | Estado |
| `org_unit` | FK → OrganizationalUnit | Unidad |

**Categorías de Equipamiento:**

| Categoría | Ejemplos |
|-----------|----------|
| **Computadoras** | PCs de monitoreo, laptops |
| **Cámaras Portátiles** | Mochilas de cámara, cámaras corporales |
| **Video Cámaras** | Handycams, cámaras de grabación |
| **Accesorios** | Trípodes, soportes, cables |
| **Almacenamiento** | Discos extraíbles, memorias USB, DVDs |
| **Comunicaciones** | Radios, intercomunicadores |

> **Nota**: Las cámaras fijas de vigilancia (CCTV) se gestionan en el modelo `Camera`, no aquí.

#### Camera

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(200) | Nombre de la cámara |
| `location` | FK → CatalogItem | Ubicación |
| `camera_type` | FK → CatalogItem | Tipo de cámara |
| `status` | Enum(Operativa, Con Falla, Fuera de Servicio, Mantenimiento) | Estado |
| `ip_address` | GenericIPAddress | Dirección IP |
| `serial_number` | CharField(120) | Serie |
| `brand` / `model` | CharField(120) | Marca y modelo |
| `installation_date` | DateField | Fecha instalación |
| `org_unit` | FK → OrganizationalUnit | Unidad |
| `org_system` | FK → CctvSystem | Sistema CCTV |

#### CameraUpdate (Novedades de Cámara)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `camera` | FK → Camera | Cámara afectada |
| `update_type` | Enum(Falla, Reparacion, Mantenimiento, Observacion) | Tipo |
| `description` | TextField | Descripción |
| `date` | DateField | Fecha del evento |
| `reported_by` | CharField(150) | Quien reporta |
| `resolved_at` | DateField | Fecha de resolución |
| `status` | Enum(Abierta, Cerrada) | Estado |

---

### App: `documents` - Mesa de Entrada y Registros Fílmicos

#### Document (Expediente)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `doc_type` | Enum(ENTRADA, SALIDA) | Tipo de documento |
| `date` | DateField | Fecha |
| `reference_number` | CharField(120) | Número de referencia (único) |
| `sender` | CharField(150) | Remitente |
| `recipient` | CharField(150) | Destinatario |
| `subject` | CharField(200) | Asunto |
| `description` | TextField | Descripción |
| `status` | Enum(PENDIENTE, EN_PROCESO, ARCHIVADO, FINALIZADO) | Estado |
| `priority` | Enum(BAJA, MEDIA, ALTA) | Prioridad |

#### DocumentAttachment

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `document` | FK → Document | Documento padre |
| `file` | FileField | Archivo (upload to docs/%Y/%m/) |
| `original_name` | CharField(255) | Nombre original |

#### FilmRecord (Registro Fílmico)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nro_asunto` | CharField(120) | Número de asunto |
| `nro_orden` | CharField(120) | Número de orden |
| `fecha_ingreso` | DateField | Fecha de ingreso |
| `tipo_solicitud` | FK → CatalogItem | Tipo de solicitud |
| `solicitante` | CharField(150) | Solicitante |
| `causa_judicial` | CharField(200) | Causa judicial |
| `tipo_delito` | FK → CatalogItem | Tipo de delito |
| `estado` | Enum(Pendiente, En Proceso, Finalizado, Verificado) | Estado |
| `org_unit` | FK → OrganizationalUnit | Unidad |
| `org_system` | FK → CctvSystem | Sistema CCTV |
| `has_backup` | BooleanField | Si se realizó backup del video |
| `backup_from_date` | DateTimeField | Fecha/hora inicio del video respaldado |
| `backup_to_date` | DateTimeField | Fecha/hora fin del video respaldado |
| `backup_location` | CharField(255) | Ubicación del backup (carpeta, disco, etc.) |
| `backup_size_mb` | DecimalField | Tamaño del backup (almacenado en MB). En el frontend el usuario selecciona MB o GB |
| `verified_by` | FK → User (nullable) | Usuario CREV que verificó |
| `verified_at` | DateTimeField (nullable) | Fecha de verificación |
| `verification_notes` | TextField | Observaciones de verificación |

---

### App: `operations` - Hechos/Novedades COC

#### Hecho

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nro_orden` | PositiveIntegerField | Número de orden (indexado) |
| `fecha_intervencion` | DateTimeField | Fecha/hora de intervención (indexado) |
| `novedad` | CharField(200) | Descripción breve |
| `quien_detecta` | Enum(Guardia de Prevencion, Centro Monitoreo) | Detector |
| `elementos` | CharField(200) | Elementos involucrados |
| `sector` | CharField(200) | Sector |
| `solucionado_coc` | BooleanField | Si se solucionó en COC |
| `genero_causa` | BooleanField | Si generó causa judicial |
| `status` | Enum(Abierto, Cerrado) | Estado (indexado) |
| `cctv_system` | FK → CctvSystem | Sistema CCTV relacionado |
| `camera` | FK → Camera | Cámara relacionada |
| `resolved_group` | FK → OrganizationalGroup | Grupo que resolvió |
| `org_unit` | FK → OrganizationalUnit | Unidad/COC (indexado) |
| `resolved_at` | DateTimeField | Fecha de resolución |
| `resolved_by` | FK → User | Usuario que resolvió |
| **`minutos_resolucion`** | Propiedad calculada | `resolved_at - fecha_intervencion` |
| **`tiempo_resolucion_legible`** | Propiedad calculada | Formato "Xh Ym" |

---

## 6.2 Índices de Base de Datos

| Modelo | Campos Indexados |
|--------|------------------|
| Equipment | `status`, `category` |
| Camera | `status`, `location`, `org_unit` |
| Document | `reference_number`, `status`, `priority` |
| FilmRecord | `estado`, `fecha_ingreso` |
| Hecho | `fecha_intervencion`, `nro_orden`, `status`, `org_unit` |

## 6.3 Integridad de Datos

* **ON DELETE CASCADE**: Si se borra un `Document`, se borran sus `DocumentAttachment`
* **ON DELETE PROTECT**: No se puede borrar un `CctvSystem` si tiene `Camera` asignadas
* **ON DELETE SET_NULL**: Referencias opcionales (user auditoría, ubicación, etc.)

---

# 7. Implementación Django 5.x

## 7.1 Apps y Responsabilidades

| App | Dominio | Modelos principales |
|-----|---------|---------------------|
| `core` | Usuarios, Roles, Catálogos, Organización | Role, Catalog, CatalogItem, OrganizationalUnit, CctvSystem, OrganizationalGroup, User |
| `inventory` | Equipamiento y Cámaras | Equipment, Camera, CameraUpdate |
| `documents` | Mesa de Entrada y Registros Fílmicos | Document, DocumentAttachment, FilmRecord |
| `operations` | Hechos/Novedades | Hecho |
| `utilities` | Herramientas de soporte | Hash Tool |

## 7.2 Comandos Operativos

```bash
# Instalación de dependencias
python -m pip install -r requirements.txt

# Base de datos
python manage.py migrate

# Seeds iniciales
python manage.py seed_roles          # Roles + permisos
python manage.py seed_catalogs       # Catálogos + ítems
python manage.py seed_demo_data      # Datos demo (opcional dev)

# Administración
python manage.py createsuperuser     # Crear admin

# Ejecución
python manage.py runserver           # Servidor desarrollo

# Testing
python manage.py test                # Suite de pruebas
```

## 7.3 Seeds Incluidos

* **Roles**: `admin`, `turno_crev`, `turno_coc` con permisos por módulo/acción
* **Catálogos**: Categorías, Ubicaciones, Estados Equipo, Tipos Cámara, Tipos Solicitud, Tipos Delito, Unidades, Organismos + ítems base
* **Demo (opcional)**: Usuario admin, unidad CREV Central, sistema principal, equipo, cámara, expediente, registro fílmico y hecho de ejemplo

## 7.4 Consideraciones Técnicas

* **Índices**: Agregados en campos de filtrado frecuente
* **Permisos**: `ModulePermissionRequiredMixin` + tag `{% has_permission %}` en templates
* **Adjuntos**: `DocumentAttachment` permite múltiples archivos por documento
* **Auditoría**: Campos `created_by/at`, `updated_by/at` donde aplica

## 7.5 Estándares de Código

* Código en inglés, UI en español
* PEP 8 + convenciones Django (apps separadas por dominio)
* Tailwind vía CDN en `base.html` (sin build step)

---

# 8. Relaciones Operativas CCTV/COC

## 8.1 Jerarquía Organizacional

```
CEAC (Administración Central)
│
└── CREV (Centro de Monitoreo y Fiscalización)
    │
    ├── OrganizationalGroup (Turno CREV Mañana, Turno CREV Tarde, etc.)
    │   └── units[] → [Unidad A, Unidad B, ...] (unidades a fiscalizar)
    │
    └── COC / OrganizationalUnit (Unidades Operativas)
        ├── has_coc: true/false (si tiene Sala COC)
        ├── CctvSystem[] (Sistemas CCTV: Hikvision, Dahua, etc.)
        │   ├── brand, model, ip_address
        │   └── Camera[] (Cámaras del sistema)
        │       └── CameraUpdate[] (Novedades)
        ├── Equipment[] (Equipamiento: NVR, VMS, switches, storage)
        ├── Hecho[] (Hechos/Intervenciones)
        │   └── resolved_group (grupo que resolvió)
        └── FilmRecord[] (Registros fílmicos)
```

## 8.2 Flujo de Trabajo por Rol

### Operador COC (Nivel Operativo)

1. **Inicio de turno**: Accede al sistema con su usuario asignado a una `OrganizationalUnit`
2. **Carga de Hechos**: Registra intervenciones, asociando automáticamente a su unidad
3. **Novedades de Cámaras**: Reporta fallas/reparaciones de cámaras de su unidad
4. **Registros Fílmicos**: Gestiona solicitudes de evidencia de su unidad

### Fiscalizador CREV (Nivel Supervisión)

1. **Monitoreo**: Ve dashboard consolidado de TODAS las unidades a su cargo
2. **Mesa de Entrada**: Gestiona documentos oficiales (entradas/salidas)
3. **Inventario**: Administra equipamiento y cámaras de sus unidades
4. **Fiscalización**: Revisa Hechos, Novedades y Registros de las unidades

### Administrador CEAC (Nivel Global)

1. **Configuración**: Gestiona usuarios, roles, catálogos
2. **Auditoría**: Acceso a logs y reportes de todo el sistema
3. **Reportes consolidados**: KPIs globales de todas las unidades

## 8.3 Lógica de Filtrado Automático

| Rol | Filtrado Aplicado |
|-----|------------------|
| **COC** | `queryset.filter(org_unit=request.user.org_unit)` |
| **CREV** | `queryset.filter(org_unit__in=request.user.get_supervised_units())` |
| **CEAC** | Sin filtro (acceso global) |

> El método `get_supervised_units()` obtiene todas las unidades de los grupos del usuario:
> `user.org_groups.values_list('units', flat=True)`

---

> **Última actualización**: Enero 2026  
> **Versión**: 2.1.0
