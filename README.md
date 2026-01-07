# Sistema de Gestión Integral CREV

> **Plataforma Unificada de Operaciones, Documentación e Inventario.**

Este repositorio contiene el código fuente y la documentación técnica del Sistema de Gestión CREV. El sistema ha evolucionado hacia una arquitectura monolítica robusta basada en **Django**, diseñada para centralizar la gestión operativa con alta eficiencia y seguridad.

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura **Web Monolítica (Server-Side Rendering)** basada en el patrón **MVT (Model-View-Template)** de Django. Se prioriza la simplicidad, la seguridad y el rendimiento.

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Backend** | **Python Django 5.x** | Núcleo lógico, seguridad, ORM y ruteo. |
| **Frontend** | **Django Templates (DTL)** | Renderizado de vistas HTML desde el servidor. |
| **Estilos** | **Tailwind CSS** | Framework de utilidades para replicar la estética "Tech/Glass". |
| **Scripting** | **Vanilla JS / Alpine.js** | Interactividad ligera (modales, menús) sin frameworks pesados. |
| **Base de Datos** | **SQLite** | Almacenamiento relacional local, portable y eficiente. |

---

## 👥 Actores y Roles

El sistema implementa un control de acceso basado en roles (RBAC):

1.  **Administrador**: Acceso total al panel de administración y configuración del sistema.
2.  **Operador/Técnico**: Usuario principal. Carga novedades ("Hechos"), gestiona expedientes y actualiza inventarios.
3.  **Visualizador**: Acceso de solo lectura para auditoría y consulta de reportes.

---

## 📦 Módulos Funcionales

### 1. Gestión de Novedades (Libro de Guardia Digital)
Registro inmutable de eventos operativos diarios.
*   **Funciones**: Alta de novedades, categorización (Seguridad, Mantenimiento), adjuntar evidencias multimedia.
*   **Tecnología**: Formularios Django con validación server-side.

### 2. Mesa de Entrada (Documentación)
Sistema de seguimiento de expedientes y notas oficiales.
*   **Funciones**: Registro de Entradas/Salidas, asignación de prioridades, workflow de estados (Pendiente → Finalizado).
*   **Datos**: Trazabilidad completa de remitentes, destinatarios y fechas.

### 3. Inventario y Equipamiento (VMS)
Gestión de activos de videovigilancia.
*   **Alcance**: Servidores de Grabación (VMS) y Cámaras IP asociadas.
*   **Detalle**: Control de estado (Online/Offline), modelos, IPs y ubicación.

### 4. Utilidades Técnicas
Herramientas de soporte y verificación.
*   **Hash Tool**: Verificación de integridad de archivos (MD5, SHA256) ejecutada en el servidor.

### 5. Dashboard y Métricas
Visualización centralizada de la operación.
*   **Dashboard**: Gráficos e indicadores de Novedades de Cámaras y estado de Expedientes.

---

## 🗄️ Esquema de Base de Datos (SQLite)

El modelo de datos relacional está diseñado para asegurar integridad referencial:

### Core & Auth
*   Extensión del modelo `AbstractUser` de Django para gestión de roles y perfiles.

### Modelos Principales
*   **`Hecho`**: Novedad operativa. Relación `Foreign Key` con `User` y `Categoria`.
*   **`Expediente`**: Documento oficial. Posee `numero_referencia` único e integra múltiples `Adjuntos` (Relación 1 a N).
*   **`VMS`** y **`Camara`**: Relación jerárquica (Un VMS tiene muchas Cámaras).

---

## 🚀 Guía de Instalación (Desarrollo)

### Prerrequisitos
*   **Python 3.10+**
*   **Git**

### Pasos Iniciales
1.  **Clonar repositorio**:
    ```bash
    git clone <repo-url>
    cd equipamiento
    ```
2.  **Crear entorno virtual**:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    ```
3.  **Instalar dependencias**:
    ```bash
    pip install django django-tailwind
    ```
4.  **Migraciones**:
    ```bash
    python manage.py migrate
    ```
5.  **Ejecutar Servidor**:
    ```bash
    python manage.py runserver
    ```

---

> **Nota**: Este proyecto sustituye la versión anterior basada en Angular/Firebase, consolidando toda la lógica en un stack 100% Python.
