# Diagramas de Roles y Permisos

## Flujo de Autenticación y Autorización

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend as Angular App
    participant Backend as Django API
    participant DB as Database

    User->>Frontend: Ingresa credenciales
    Frontend->>Backend: POST /api/auth/login/
    Backend->>DB: Valida usuario y contraseña
    DB-->>Backend: User + Groups + Permissions
    Backend->>Backend: Genera JWT + payload con permisos
    Backend-->>Frontend: access_token + user { permissions }
    Frontend->>Frontend: Guarda token y permisos en estado
    
    loop Cada petición protegida
        Frontend->>Backend: GET /api/assets/ + Bearer token
        Backend->>Backend: Valida token y verifica permisos
        Backend-->>Frontend: Response (200 OK o 403 Forbidden)
    end
```

## Jerarquía de Roles

```mermaid
graph TD
    A[ADMIN<br/>Todos los permisos] --> B[COORDINADOR CREV<br/>+ manage_crev_flow]
    B --> C[CREV<br/>+ integrity/reports/verify]
    B --> D[COORDINADOR COC<br/>+ manage_assets/personnel]
    D --> E[OPERADOR<br/>+ manage_novedades/hechos/records]
    E --> F[READ_ONLY<br/>Solo visualización]
    
    style A fill:#f66,stroke:#333
    style B fill:#f96,stroke:#333
    style C fill:#9c6,stroke:#333
    style D fill:#69c,stroke:#333
    style E fill:#6c9,stroke:#333
    style F fill:#ccc,stroke:#333
```

## Matriz de Permisos Visual

```mermaid
mindmap
  root((Permisos))
    Dashboard
      view_dashboard
    Activos
      view_assets
      manage_assets
    Personal
      view_personnel
      manage_personnel
    Novedades
      view_novedades
      manage_novedades
    Hechos
      view_hechos
      manage_hechos
    Records
      view_records
      manage_records
    CREV
      use_integrity_tools
      use_report_tools
      verify_crev_record
      manage_crev_flow
    Sistema
      view_settings
      manage_users
```

## Asignación de Roles a Usuarios

```mermaid
erDiagram
    USER ||--o{ GROUP : pertenece_a
    GROUP ||--|{ PERMISSION : tiene
    USER ||--|| PERSON : vinculado_a
    PERSON }o--|| UNIT : asignado_a
    
    USER {
        int id
        string username
        string password
        boolean is_superuser
        boolean is_active
    }
    
    GROUP {
        string name "ADMIN, CREV, etc"
    }
    
    PERMISSION {
        string codename "manage_assets"
        string name "Can manage assets"
    }
    
    PERSON {
        string role "OPERADOR"
        string badge_number
        string rank
    }
    
    UNIT {
        string code "U001"
        string name "Comisaría 1ra"
    }
```

## Flujo de Verificación de Permisos

```mermaid
flowchart TD
    A[Request a vista protegida] --> B{Usuario autenticado?}
    B -->|No| C[Retornar 401 Unauthorized]
    B -->|Sí| D{Es superuser?}
    D -->|Sí| E[Permitir acceso]
    D -->|No| F[Obtener permisos del usuario]
    F --> G{Vista requiere permisos?}
    G -->|No| E
    G -->|Sí| H{Tiene todos<br/>los permisos?}
    H -->|Sí| E
    H -->|No| I[Retornar 403 Forbidden]
    
    style C fill:#f66
    style E fill:#6c6
    style I fill:#f66
```

## Componentes del Sistema de Permisos

```mermaid
graph LR
    subgraph "Backend (Django)"
        A[access.py<br/>Permisiones custom] --> B[permissions.py<br/>HasNamedPermission]
        C[models.py<br/>Person + Profile] --> D[signals.py<br/>Auto-asigna roles]
        B --> E[views.py<br/>action_permissions]
    end
    
    subgraph "Frontend (Angular)"
        F[auth.models.ts<br/>PermissionCodes] --> G[auth.service.ts<br/>hasPermission]
        G --> H[auth.guard.ts<br/>permissionGuard]
        H --> I[rutas protegidas]
    end
    
    Backend -.->|API Response| Frontend
```

---

*Documentación complementaria a `2-roles-and-permissions.md`*
