# Arquitectura del Sistema - GestorCOC v2.0

> **Estilo Arquitectónico**: Django MVT (Model-View-Template) reforzado con Clean Architecture.
> **Enfoque**: Server-Side Rendering (SSR) con interactividad progresiva (HTMX).
> **Objetivo**: Sistema monolítico robusto, fácil de desplegar y mantener.

## 1. Diagrama de Bloques (Django SSR)

```mermaid
graph TD
    subgraph "Cliente (Navegador)"
        Browser[Browsers HTML5]
    end

    subgraph "Servidor (Django Runtime)"
        subgraph "Presentation Layer (Views & Templates)"
            Urls[URL Dispatcher]
            Views[Django Views (Controllers)]
            Templates[HTML Templates (Tailwind)]
        end

        subgraph "Application Layer (Services)"
            Services[Business Services / Use Cases]
            Forms[Django Forms (Validation)]
        end

        subgraph "Infrastructure Layer"
            ORM[Django ORM (Repository Impl)]
            Storage[File System / Media]
        end
    end

    subgraph "Persistencia (DB)"
        DB[(Oracle Database / SQLite)]
    end

    Browser -- "HTTP Request (GET/POST)" --> Urls
    Urls --> Views
    Views -- "Call Logic" --> Services
    Services -- "Query" --> ORM
    ORM -- "SQL" --> DB
    Views -- "Render Context" --> Templates
    Templates -- "HTML Response" --> Browser
```

## 2. Patrones de Diseño Implementados

### 2.1 MVT + Service Layer
Aunque Django promueve "Skinny Views, Fat Models", para mantener el sistema **testable** y **organizado**, usaremos una Capa de Servicios.
*   **Views**: Solo manejan HTTP (Request -> Services -> Response). No contienen lógica de negocio compleja.
*   **Services**: (`ReportNovedadService.py`) Ejecutan las reglas de negocio (validar estados, enviar emails).
*   **Models**: Definen la estructura de datos y relaciones.

### 2.2 Estrategia de Frontend (SSR + HTMX)
*   **No SPA**: No usamos React/Angular separado.
*   **Templates**: Django Templates renderizan el HTML en el servidor.
*   **HTMX**: Usado para interacciones dinámicas (ej: filtrado de tablas sin recargar, validación in-line) para dar una experiencia "App-like" sin la complejidad de una API REST separada.
*   **Estilos**: TailwindCSS compilado.

### 2.3 Persistencia y Oracle
Django abstrae la base de datos a través de sus `backends`.
*   **Producción**: `django.db.backends.oracle`. Se requiere el driver `oracledb` (o `cx_Oracle`).
*   **Migraciones**: El sistema de migraciones de Django gestionará las diferencias de esquema automáticamente entre SQLite (Dev) y Oracle (Prod).

## 3. Estructura de Proyecto (Django App)

```
/project_root
  /gestorcoc        # Configuración Global (settings, wsgi)
  /core             # Modelos Base, Mixins, Utils
  /apps
    /assets         # (Inventario) Models: Asset, Camera. Views: InventoryList.
    /novedades      # (Fallas) Models: Novedad. Services: ReportFailure.
    /film_records   # (Evidencia) Models: Request, Backup.
    /access_control # (Personal) Models: Person, AccessLog.
  /templates        # HTML global y por app
  /static           # CSS, JS, Images
  /media            # Uploads (Adjuntos, Evidencias - path stored in DB)
```

## 4. Decisiones Clave

1.  **Motor de Base de Datos**:
    *   **Desarrollo**: SQLite 3.
    *   **Prod**: Oracle Database (19c o superior).
2.  **Manejo de Archivos**:
    *   Uso de `FileSystemStorage`.
    *   Las evidencias de video (GBs) **NO** se sirven vía Django en producción, sino vía **NGINX/Apache** alias por performance (`X-Accel-Redirect`).
3.  **Seguridad**:
    *   CSRF Protection nativa de Django.
    *   Logging centralizado de acciones críticas (Auditoría).
