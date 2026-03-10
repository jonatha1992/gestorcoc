# Arquitectura - Visión General

> Derivado de `Arquitectura.md` original.

## 1. Diseño del Sistema
GestorCOC utiliza una arquitectura desacoplada con un **Backend API REST** (Django) y un **Frontend SPA** (Angular).

## 2. Diagrama de Bloques
```mermaid
graph TD
    subgraph "Cliente (Navegador)"
        SPA[Angular 21 SPA]
    end

    subgraph "Servidor Django"
        subgraph "API Layer"
            URLs[URL Dispatcher]
            Views[ViewSets / APIViews DRF]
        end
        subgraph "Business Layer"
            Services[IntegrityService]
            AI[Proveedores IA]
        end
        subgraph "Data Layer"
            ORM[Django ORM]
        end
        subgraph "Static Files"
            WN[WhiteNoise]
        end
    end

    SPA -- "HTTP JSON" --> URLs
    URLs --> Views
    Views --> Services
    Services --> AI
    ORM --> DB[(DB)]
```

## 3. Distribución de Apps
- `assets/`: Inventario CCTV y equipamiento.
- `novedades/`: Fallas y eventos.
- `personnel/`: Gestión de personal.
- `records/`: Registros fílmicos y servicios IA.
- `hechos/`: Bitácora operativa.
