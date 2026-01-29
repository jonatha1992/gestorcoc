# Documentación del Sistema GestorCOC v2.0

> **Visión 2026**: Centralización Operativa y Trazabilidad de Evidencia.
>
> **Misión Crítica**:
> 1.  **¿Qué infraestructura tenemos?** (Inventario de Cámaras, DVRs, Equipos y sus fallas).
> 2.  **¿Dónde está la evidencia?** (Registros de video, backups y su cadena de custodia).

---

## Índice

1.  [Visión y Alcance](#1-visión-y-alcance)
2.  [Roles y Jerarquía](#2-roles-y-jerarquía)
3.  [Módulo Prioridad 1: Gestión de Novedades y Equipamiento](#3-módulo-prioridad-1-gestión-de-novedades-y-equipamiento)
4.  [Módulo Prioridad 2: Registros Fílmicos](#4-módulo-prioridad-2-registros-fílmicos)
5.  [Módulos de Soporte Operativo](#5-módulos-de-soporte-operativo)
6.  [Requisitos Técnicos Transversales](#6-requisitos-técnicos-transversales)

---

# 1. Visión y Alcance

## 1.1 Propósito
El Sistema GestorCOC v2.0 es la plataforma central para la administración técnica y operativa de los Centros de Operaciones y Control (COC). Se abandona la gestión administrativa generalista (Mesa de Entrada) para enfocarse puramente en la **Gestión de Activos Técnicos (CCTV)** y la **Trazabilidad de Evidencia Digital**.

## 1.2 Prioridades de Desarrollo
1.  **Fundacional**: Inventario y Estado de Salud de la Infraestructura.
2.  **Crítico**: Gestión de Evidencia (Registros Fílmicos) y Auditoría.
3.  **Operativo**: Control de Acceso Físico y Gestión de Personal.

---

# 2. Roles y Jerarquía
La supervisión recae en CREV.

## 2.1 Actores del Sistema

| Rol | Nivel | Responsabilidad Principal | Alcance |
| :--- | :--- | :--- | :--- |
| **Administrador** | Sistema | Configuración global, ABM de Usuarios, Auditoría Técnica. | Total |
| **Fiscalizador (CREV)** | Supervisión | **Auditoría de Evidencia**, Control de Inventario, Gestión de Personal, Validación de Novedades. | Múltiples Unidades (COCs) |
| **Operador (COC)** | Operativo | Carga de Novedades, Generación de Registros Fílmicos, Operación Diaria. | Su Unidad asignada |

**Áreas Externas (Sin usuario, solo interacción por Ticket/Email):**
*   **DGT**: Dirección de Gestión Tecnológica (Soporte Nivel 2/3).
*   **CCO**: Centro de Control Operativo (Coordinación).

---

# 3. Módulo Prioridad 1: Gestión de Novedades y Equipamiento

> **Objetivo**: "No se puede reportar una falla si no sabemos que el equipo existe".

## 3.1 Inventario de Infraestructura (CCTV)

| ID Form | Nombre | Descripción del Requisito |
| :--- | :--- | :--- |
| **FR-INV-01** | **Sistemas Raíz (VMS/NVR)** | Registro de "Cabeceras". Datos: Marca (Hikvision/Dahua), IP de Gestión, Ubicación Física, Responsable Técnico, Capacidad de Almacenamiento. |
| **FR-INV-02** | **Cámaras** | Carga de cámaras vinculadas a un Sistema Raíz. Datos: Nombre Lógico, IP, Canal Físico, Ubicación (Calle/Zona), Estado Operativo. |
| **FR-INV-03** | **Equipamiento Auxiliar** | Inventario de monitores, joysticks, workstations, mobiliario y UPS en cada sala. |
| **FR-INV-04** | **Búsqueda Rápida (Hash Index)** | **Rendimiento Crítico**: Todo activo debe ser ubicable por IP, Nombre, ID Interno o Código QR en **< 1 segundo**. |

## 3.2 Gestión de Novedades Técnicas

| ID Form | Nombre | Descripción del Requisito |
| :--- | :--- | :--- |
| **FR-NOV-01** | **Reporte de Falla** | El operador reporta una avería seleccionando **directamente el activo del inventario**. Tipificación rápida: "Sin Video", "Disco Lleno", "Desconectado". |
| **FR-NOV-02** | **Estado del Activo (Automático)** | Al reportar una novedad crítica (ej: Sin Video), el estado del activo (Cámara/NVR) cambia automáticamente a **"Con Falla"** o **"Fuera de Servicio"**. |
| **FR-NOV-03** | **Hoja de Vida (Historial)** | Visualización cronológica de todas las reparaciones, fallas y mantenimientos de un equipo específico. |
| **FR-NOV-04** | **Dashboard de Salud** | Vista para CREV/Admin que muestra % de Cámaras Online vs Offline por Unidad. |

---

# 4. Módulo Prioridad 2: Registros Fílmicos

> **Objetivo**: Gestión de la evidencia digital y cadena de custodia.

## 4.1 La "Carpeta" de Evidencia

| ID Form | Nombre | Descripción del Requisito |
| :--- | :--- | :--- |
| **FR-FILM-01** | **Alta de Registro** | El operador crea una carpeta digital para un requerimiento judicial/policial. <br> **Datos**: Nro. Causa/Oficio, Juzgado/Fiscalía, Cámaras Involucradas (Link a Inventario), Rango Horario. |
| **FR-FILM-02** | **Ruta y Custodia** | Registro de la ubicación física del backup (`/storage/causa_2026_001/`) y el **Hash Original** (Huella digital) de los archivos exportados. |

## 4.2 Auditoría y Certificación (Rol CREV)

| ID Form | Nombre | Descripción del Requisito |
| :--- | :--- | :--- |
| **FR-FILM-03** | **Verificación Técnica** | Herramienta para el Fiscalizador (CREV). Compara el Hash del archivo en disco contra el Hash registrado en FR-FILM-02. |
| **FR-FILM-04** | **Informe Técnico** | Emisión de un "Certificado de Integridad/Validez" por parte de CREV, aprobando la entrega de la evidencia. |

## 4.3 Retención y Limpieza

| ID Req | Nombre | Descripción |
| :--- | :--- | :--- |
| **FR-FILM-05** | **Política de Retención** | El sistema alerta sobre backups que superan los **30 días** (paramtrizable) de antigüedad para proceder a su borrado seguro o archivado en frío. |

---

# 5. Módulos de Soporte Operativo

## 5.1 Gestión de Personal (COC/CREV)

Más allá de la administración básica, este módulo perfila las capacidades operativas de cada agente.

| ID Form | Nombre | Descripción del Requisito |
| :--- | :--- | :--- |
| **FR-PER-01** | **Legajo Digital** | Información base del operador: Nombre, Jerarquía, Unidad de Revista, Grupo de Guardia (Turno). |
| **FR-PER-02** | **Matriz de Competencias** | Registro de **Cursos y Capacitaciones** realizados (ej: "Operador VMS Nivel 1", "Protocolo de Emergencias"). Permite filtrar personal calificado para tareas específicas. |
| **FR-PER-03** | **Control de Asistencia** | Registro simplificado de Presentismo y Licencias para planificación de turnos. |

## 5.2 Control de Acceso Físico (Seguridad)

Gestión de la seguridad "física" de la Sala COC.

| ID Form | Nombre | Descripción del Requisito |
| :--- | :--- | :--- |
| **FR-ACC-01** | **Lista Blanca** | ABM de personal autorizado a ingresar (Propios, Técnicos DGT, Visitas Recurrentes). Gestionado por CREV. |
| **FR-ACC-02** | **Libro de Guardia Digital** | Registro rápido de Ingreso/Egreso: Quién, Hora, Motivo. Debe ser ágil (ej: búsqueda por DNI o selección de lista). |

## 5.3 Integración Externa (DGT / CCO)

El sistema formaliza la comunicación con áreas que **NO** usan el sistema pero proveen servicios críticos (Soporte Técnico, Coordinación).

### Flujo de Ticket Externo

1.  **Generación**: El Operador crea una novedad que requiere intervención externa (ej: "Cámara vandalizada").
2.  **Notificación**: El sistema genera un **Borrador de Email** estandarizado con los detalles técnicos (ID Activo, Falla, Ubicación).
3.  **Envío**: El operador envía el correo a la mesa de ayuda de DGT/CCO.
4.  **Respuesta y Traza**:
    *   DGT/CCO responde el correo asignando un **Ticket Externo** (ej: `REQ-2026-999`).
    *   El operador ingresa ese ID en el campo **"Ticket Externo"** del registro en GestorCOC.
    *   Esto vincula la Novedad interna con la gestión externa.

| ID Req | Nombre | Descripción |
| :--- | :--- | :--- |
| **FR-EXT-01** | **Vinculación de Ticket** | Campo de texto libre/alfanumérico en Novedades y Pedidos para asociar el ID del sistema externo. |
| **FR-EXT-02** | **Generador de Plantillas** | El sistema debe pre-armar el cuerpo del correo con datos precisos del inventario para evitar errores de tipeo al pedir soporte. |

## 5.4 Módulo de Hechos (Bitácora Operativa)
*   Registro de intervenciones policiales/operativas observadas desde el COC.
*   Vinculación con Cámaras (Inventario) para referenciar dónde ocurrió el hecho.

## 5.3 Sistema de Tickets (Solicitudes)
*   Canal formal de comunicación entre COC/CREV y áreas externas (DGT).
*   Solicitudes de reparación de hardware, insumos o capacitación.

---

# 6. Requisitos Técnicos Transversales

## 6.1 Arquitectura de Datos
*   **Monolito de Metadatos**: El sistema **NO almacena video**. Almacena **ubicaciones (paths)**, metadatos y Hashes.
*   **Base de Datos**: Relacional.
    *   **Desarrollo**: SQLite.
    *   **Producción/Testing**: **Oracle Database**.

## 6.2 Rendimiento
*   **Búsqueda O(1)**: Indexación eficiente para encontrar activos por IP/Nombre instantáneamente.
*   **Carga Diferida**: Los listados de cámaras (que pueden ser miles) deben usar paginación o virtualización en el frontend.

## 6.3 Seguridad
*   **Trazabilidad Total**: Cada cambio de estado en un equipo o registro de evidencia queda logueado con: Usuario, IP, Timestamp.
*   **Integridad**: Los Hashes de evidencia no deben ser modificables una vez certificados por CREV.
