# Documentación Técnica Unificada - Sistema de Gestión CREV

> **Aviso**: Este documento consolida la Especificación de Requisitos de Software (SRS) y el Diseño del Esquema de Base de Datos para el proyecto de migración a Django. Puede exportarse a PDF o Word utilizando herramientas como Pandoc.

---

# PARTE A: Especificación de Requisitos de Software (ERS/SRS)

## 1. Introducción

### 1.1 Propósito
El propósito de este documento es definir formal y exhaustivamente los requisitos funcionales y no funcionales para la versión 2.0 del **Sistema de Gestión CREV**. Este documento servirá como contrato de alcance entre los stakeholders y el equipo de desarrollo para la migración de la arquitectura actual a una solución monolítica basada en **Django**.

### 1.2 Alcance del Producto
El Sistema de Gestión CREV es una plataforma web centralizada diseñada para optimizar las operaciones diarias del Centro de Monitoreo. 
El sistema abarcará:
1.  **Gestión de Novedades Técnicas**: Registro de incidentes de hardware/software (Cámaras/VMS) para estadística y auditoría técnica (No suplanta el Libro de Guardia legal).
2.  **Mesa de Entrada (Expedientes)**: Trazabilidad completa de documentación oficial (Entradas/Salidas).
3.  **Inventario Técnico (VMS)**: Control de activos de videovigilancia (Servidores y Cámaras).
4.  **Utilidades de Integridad**: Herramientas criptográficas para validación de evidencia digital.

El sistema operará bajo una arquitectura **Monolítica (Server-Side Rendering)** utilizando **Django 5.x** y **SQLite** (con capacidad de migración transparente a PostgreSQL/MySQL), reemplazando la implementación previa de SPA.

### 1.3 Definiciones, Acrónimos y Abreviaturas
*   **SRS**: Software Requirements Specification (Especificación de Requisitos de Software).
*   **MVT**: Model-View-Template (Patrón de arquitectura de Django).
*   **DTL**: Django Template Language (Motor de plantillas nativo).
*   **SSR**: Server-Side Rendering (Renderizado en el servidor).
*   **RBAC**: Role-Based Access Control (Control de Acceso Basado en Roles).
*   **VMS**: Video Management System.

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
El sistema es una solución independiente (standalone) que integra múltiples flujos operativos en una única interfaz web.
*   **Interfaz de Usuario**: Web responsive con estética moderna ("Glassmorphism").
*   **Motor de Base de Datos**: Relacional (SQLite), gestionado vía ORM.
*   **Seguridad**: Autenticación nativa de Django con manejo de sesiones seguras.

### 2.2 Características de los Usuarios
| Clase de Usuario | Nivel de Acceso | Responsabilidades | Conocimiento Técnico |
| :--- | :--- | :--- | :--- |
| **Administrador** | Total (Superuser) | Gestión de usuarios, configuración global, auditoría. | Alto |
| **Operador de Guardia** | Escritura/Lectura | Carga de novedades diarias, seguimiento de expedientes. | Medio |
| **Responsable Técnico** | Escritura/Lectura | Gestión de inventario VMS, alta/baja de cámaras. | Alto |
| **Auditor/Visualizador** | Solo Lectura | Consulta de reportes, búsqueda histórica. | Bajo |

### 2.3 Entorno Operativo
*   **Servidor de Aplicación**: Compatible con cualquier SO que soporte **Python 3.11.5+** (Windows Server / Linux).
*   **Framework**: **Django 5.x** (SSR, MVT) con DTL + Tailwind (CDN).
*   **Cliente**: Navegadores Web Modernos (Chrome, Edge, Firefox).
*   **Red**: Intranet Corporativa (LAN).

---

## 3. Requisitos de Interfaz Externa

### 3.1 Interfaz de Usuario (UI)
*   **UI-01**: El sistema implementará una barra lateral (Sidebar) persistente para la navegación principal.
*   **UI-02**: El diseño utilizará el framework **Tailwind CSS** para implementar un modo oscuro visual con efectos de transparencia ("Glassmorphism").
*   **UI-03**: Las interacciones críticas (confirmaciones, modales) no deben requerir recarga completa de página (uso de JavaScript/HTMX).

### 3.2 Interfaz de Software
*   **SI-01**: El sistema utilizará **SQLite 3** como motor de persistencia.
*   **SI-02**: El sistema se comunicará con el sistema de archivos del servidor para el almacenamiento de adjuntos (`/media`).

---

## 4. Requisitos Funcionales (RF)

### 4.1 Módulo de Autenticación y Seguridad (Core)
*   **FR-AUTH-001 (Inicio de Sesión)**: El sistema debe permitir el acceso mediante credenciales (Usuario/Contraseña) validadas contra la base de datos local.
*   **FR-AUTH-002 (Control de Sesión)**: El sistema debe cerrar automáticamente la sesión tras un periodo de inactividad configurable.
*   **FR-AUTH-003 (Gestión de Roles)**: El acceso a cada módulo debe estar restringido estrictamente por los permisos asignados al grupo del usuario.

### 4.2 Módulo de Novedades Técnicas (Incidentes)
*   **FR-LOG-001 (Alta de Incidente)**: El sistema debe permitir registrar eventos técnicos (ej: "Cámara sin video", "VMS reiniciado") con fines estadísticos y de mantenimiento.
*   **FR-LOG-002 (Adjuntos)**: El usuario debe poder adjuntar evidencias (imágenes/PDF) al registro del incidente.
*   **FR-LOG-003 (Estadísticas y Dashboard)**: El sistema debe generar indicadores de *Uptime* y *Tasa de Fallos* por **Cámara** y **VMS**, permitiendo identificar equipos problemáticos (ej: "Top 10 Cámaras con más fallas").

### 4.3 Módulo de Mesa de Entrada (Expedientes)
*   **FR-DOC-001 (Gestión de Expedientes)**: El sistema permitirá el ciclo de vida completo (Alta, Modificación, Cambio de Estado, Cierre) de expedientes.
*   **FR-DOC-002 (Numeración Automática)**: El sistema debe sugerir o generar un número de referencia único si no es provisto.
*   **FR-DOC-003 (Búsqueda Avanzada)**: El sistema proveerá filtros combinados por Fecha, Remitente, Destinatario y Estado.

### 4.4 Módulo de Inventario (VMS)
*   **FR-INV-001 (Jerarquía de Activos)**: El sistema modelará la relación `1:N` entre Servidores VMS y Cámaras.
*   **FR-INV-002 (Monitoreo de Estado)**: Permitir marcar manualmente el estado operativo (Online/Offline) de cada cámara para reportes de mantenimiento.

### 4.5 Módulo de Utilidades
*   **FR-UTIL-001 (Validación Hash)**: El sistema proveerá una interfaz para calcular hash (MD5, SHA256) de archivos subidos, validando su integridad contra valores esperados.

---

## 5. Requisitos No Funcionales (RNF)

### 5.1 Rendimiento
*   **NFR-PERF-01**: El tiempo de respuesta del servidor para vistas estándar no debe exceder los 500ms.
*   **NFR-PERF-02**: Las consultas a base de datos deben estar optimizadas (`select_related`) para evitar el problema N+1.

### 5.2 Seguridad
*   **NFR-SEC-01**: Las contraseñas se almacenarán utilizando algoritmos de hash robustos (PBKDF2/Argon2 por defecto en Django).
*   **NFR-SEC-02**: Protección contra ataques CSRF (Cross-Site Request Forgery) habilitada en todos los formularios.

### 5.3 Mantenibilidad y Escalabilidad
*   **NFR-MAINT-01**: El código debe seguir el estándar **PEP 8** de Python.
*   **NFR-MAINT-02**: La estructura del proyecto debe separar responsabilidades en "Apps" de Django.
*   **NFR-SCAL-01 (Abstracción de Datos)**: El sistema no debe utilizar funciones específicas de SQLite. Todo acceso a datos debe ser vía Django ORM para garantizar la migración futura a PostgreSQL/MySQL sin refactorización.

---
---

# PARTE B: Diseño de Base de Datos (Esquema Relacional)

## 1. Introducción
Este documento define el esquema de la base de datos **SQLite** para el Sistema de Gestión CREV. Se utilizará el **ORM de Django** para implementar este diseño.

## 2. Diagrama Entidad-Relación (Descripción Detallada)

### 2.1 Módulo de Usuarios (Core)
Se extenderá el modelo `AbstractUser` de Django.
*   **User**:
    *   `username` (PK): Texto, único.
    *   `email`: Texto.
    *   `role`: Enum (ADMIN, OPERATOR, VIEWER).
    *   `is_active`: Booleano.

### 2.2 Módulo de Hechos (Libro de Guardia)
*   **Hecho (Novedad Técnica)**:
    *   `id` (PK): Auto-incremental.
    *   `titulo`: Texto (máx 200).
    *   `descripcion`: Texto Largo (HTML/Markdown).
    *   `camara`: FK -> `Camara` (Nullable, para incidentes de una cámara específica).
    *   `vms`: FK -> `VMS` (Nullable, para fallas a nivel servidor).
    *   `fecha_ocurrencia`: DateTime.
    *   `fecha_carga`: DateTime (auto_now_add).
    *   `categoria`: FK -> `CategoriaHecho`.
    *   `usuario`: FK -> `User`.
    *   `importancia`: Enum (BJA, MED, ALT).

*   **CategoriaHecho**:
    *   `id` (PK).
    *   `nombre`: Texto (ej: "Mantenimiento", "Seguridad").
    *   `color`: Hex Code (para UI).

### 2.3 Módulo de Mesa de Entrada (Documentación)
*   **Expediente**:
    *   `id` (PK).
    *   `numero_referencia`: Texto (Unique, ej: "EXP-2024-001").
    *   `asunto`: Texto.
    *   `descripcion`: Texto Largo.
    *   `tipo`: Enum (ENTRADA, SALIDA).
    *   `remitente`: Texto.
    *   `destinatario`: Texto.
    *   `fecha`: DateTime.
    *   `prioridad`: Enum (ALTA, MEDIA, BAJA).
    *   `estado`: Enum (PENDIENTE, EN_PROCESO, FINALIZADO, ARCHIVADO).
    *   `creado_por`: FK -> `User`.

*   **AdjuntoExpediente**:
    *   `id` (PK).
    *   `expediente`: FK -> `Expediente` (RelatedName: `adjuntos`).
    *   `archivo`: FileField (Upload to `/media/docs/%Y/%m/`).
    *   `nombre_original`: Texto.

### 2.4 Módulo de Inventario (VMS y Cámaras)
*   **VMS (Servidor)**:
    *   `id` (PK).
    *   `nombre`: Texto.
    *   `hostname`: Texto (IP/Dominio).
    *   `ubicacion`: Texto.

*   **Camara**:
    *   `id` (PK).
    *   `vms`: FK -> `VMS` (Nullable, si es standalone).
    *   `nombre`: Texto.
    *   `ip`: IPAddress.
    *   `modelo`: Texto.
    *   `estado`: Enum (ONLINE, OFFLINE, MANTENIMIENTO).
    *   `ultima_verificacion`: DateTime.

## 3. Diccionario de Datos & Restricciones

### Índices
*   `Hecho.fecha_ocurrencia`: Para filtrado rápido en dashboard.
*   `Expediente.numero_referencia`: Búsqueda exacta.
*   `Expediente.estado`: Filtrado de pendientes.

### Integridad de Datos
*   **ON DELETE CASCADE**:
    *   Si se borra un `Expediente`, se borran sus `AdjuntoExpediente`.
*   **ON DELETE PROTECT**:
    *   No se puede borrar un `User` si tiene `Hechos` cargados.
    *   No se puede borrar un `VMS` si tiene `Camaras` asignadas.

---

# PARTE C: Implementación Django 5.x (Estado Actual)

## 1. Apps y Responsabilidades
| App | Dominio | Modelos principales |
| --- | --- | --- |
| `core` | Usuarios, Roles, Catálogos, Organización | `User`, `Role`, `Catalog`, `CatalogItem`, `OrganizationalUnit`, `CctvSystem` |
| `inventory` | Equipamiento y Cámaras | `Equipment`, `Camera`, `CameraUpdate` |
| `documents` | Mesa de Entrada y Registros Fílmicos | `Document`, `DocumentAttachment`, `FilmRecord` |
| `operations` | Hechos/Novedades | `Hecho` |
| `utilities` | Herramientas de soporte | Hash Tool |

## 2. Comandos Operativos
```bash
python -m pip install -r requirements.txt   # deps (Django 5)
python manage.py migrate                    # base de datos
python manage.py seed_roles                 # roles + permisos
python manage.py seed_catalogs              # catálogos + ítems
python manage.py seed_demo_data             # datos demo (opcional dev)
python manage.py createsuperuser            # admin
python manage.py runserver                  # levantar server
python manage.py test                       # smoke tests
```

## 3. Seeds Incluidos
- **Roles**: admin, turno_crev, turno_coc con permisos por módulo/acción.
- **Catálogos**: Categorías, Ubicaciones, Estados Equipo, Tipos Cámara, Tipos Solicitud, Tipos Delito, Unidades, Organismos + ítems base.
- **Demo (opcional)**: usuario admin, unidad CREV Central, sistema principal, equipo, cámara, expediente, registro fílmico y hecho de ejemplo.

## 4. Consideraciones Técnicas
- **Índices**: agregados en campos de filtrado frecuente (`status`, `estado`, `fecha_ingreso`, `nro_orden`, `fecha_intervencion`, `reference_number`).
- **Permisos**: `ModulePermissionRequiredMixin` + tag `{% has_permission %}` en templates.
- **Adjuntos**: `DocumentAttachment` permite múltiples archivos por documento; subida controlada desde `DocumentForm`.
- **Auditoría**: campos `created_by/at`, `updated_by/at` donde aplica.

## 5. Testing
- Suite base Django: `python manage.py test` (8 pruebas smoke para auth/home, inventario, documentos con adjuntos, registros fílmicos, hechos y hash tool).

## 6. Estándares
- Código en inglés, UI en español.
- PEP 8 + convenciones Django (apps separadas por dominio).
- Tailwind vía CDN en `base.html` (sin build step).
