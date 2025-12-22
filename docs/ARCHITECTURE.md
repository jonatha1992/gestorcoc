# 🏗️ Arquitectura del Sistema - Frontend

## Descripción General

**Angular Equipamiento** es una aplicación web desarrollada en Angular 21 para la gestión de equipamiento, registros fílmicos y control de cámaras del CREV. Utiliza Firebase como backend-as-a-service.

---

## 📊 Diagrama de Arquitectura

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend - Angular 21"]
        APP[App Component]
        NAV[Navbar Component]
        
        subgraph Pages["📄 Pages"]
            direction LR
            subgraph Equipment["Equipamiento"]
                EL[Equipment List]
                EF[Equipment Form]
            end
            subgraph FilmRecords["Registros Fílmicos"]
                FRL[Film Record List]
                FRF[Film Record Form]
            end
            subgraph Cameras["Control de Cámaras"]
                CL[Camera List]
                CF[Camera Form]
                CU[Camera Updates]
            end
            subgraph Catalogs["Maestros"]
                CAT[Catalogs List]
                CATI[Catalog Items]
            end
            subgraph Security["Seguridad"]
                USR[Users]
                ROL[Roles]
            end
        end
        
        subgraph Services["⚙️ Services"]
            ES[Equipment Service]
            FRS[Film Record Service]
            CS[Camera Service]
            CUS[Camera Update Service]
            CATS[Catalog Service]
            AS[Auth Service]
        end
        
        subgraph Guards["🔐 Guards"]
            AG[Auth Guard]
            RG[Role Guard]
        end
    end
    
    subgraph Firebase["☁️ Firebase"]
        FS[(Firestore Database)]
        AUTH[Authentication]
    end
    
    APP --> NAV
    APP --> Pages
    Pages --> Services
    Pages --> Guards
    Services --> FS
    Guards --> AUTH
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── app.ts                    # Componente principal
│   ├── app.config.ts             # Configuración de la aplicación
│   ├── app.routes.ts             # Definición de rutas
│   │
│   ├── components/               # Componentes reutilizables
│   │   └── navbar/
│   │
│   ├── guards/                   # Guards de autenticación/autorización
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   │
│   ├── models/                   # Modelos de datos
│   │   ├── models.ts             # Equipment, FilmRecord
│   │   ├── camera.model.ts       # Camera, CameraUpdate
│   │   ├── catalog.model.ts      # Catalog, CatalogItem
│   │   └── user.model.ts         # User, Role, Permission
│   │
│   ├── pages/                    # Páginas/Vistas
│   │   ├── equipment-list/
│   │   ├── equipment-form/
│   │   ├── film-record-list/
│   │   ├── film-record-form/
│   │   ├── camera-list/          # [NUEVO]
│   │   ├── camera-form/          # [NUEVO]
│   │   ├── camera-updates/       # [NUEVO]
│   │   ├── catalogs/             # [NUEVO]
│   │   ├── catalog-items/        # [NUEVO]
│   │   ├── users/                # [NUEVO]
│   │   └── roles/                # [NUEVO]
│   │
│   └── services/
│       ├── equipment.ts
│       ├── film-record.ts
│       ├── camera.ts             # [NUEVO]
│       ├── camera-update.ts      # [NUEVO]
│       ├── catalog.ts            # [NUEVO]
│       └── auth.ts               # [NUEVO]
│
├── environments/
└── styles.css
```

---

## 📄 Módulos del Sistema

### 1. Equipamiento (Existente)
| Página | Ruta | Descripción |
|--------|------|-------------|
| Lista | `/equipamiento` | Listado con estados y acciones |
| Nuevo | `/nuevo-equipo` | Formulario de creación |
| Editar | `/editar-equipo/:id` | Formulario de edición |

### 2. Registros Fílmicos (Existente)
| Página | Ruta | Descripción |
|--------|------|-------------|
| Lista | `/registros` | Listado de registros |
| Nuevo | `/nuevo-registro` | Formulario de creación |
| Editar | `/editar-registro/:id` | Formulario de edición |

### 3. Control de Cámaras (Nuevo)
| Página | Ruta | Descripción |
|--------|------|-------------|
| Lista | `/camaras` | Listado de cámaras |
| Nueva | `/nueva-camara` | Formulario de creación |
| Editar | `/editar-camara/:id` | Formulario de edición |
| Novedades | `/camaras/:id/novedades` | Historial de novedades |

### 4. Maestros/Catálogos (Nuevo)
| Página | Ruta | Descripción |
|--------|------|-------------|
| Catálogos | `/catalogos` | Lista de catálogos |
| Ítems | `/catalogos/:id/items` | Ítems de un catálogo |

### 5. Seguridad (Nuevo)
| Página | Ruta | Descripción |
|--------|------|-------------|
| Usuarios | `/usuarios` | Gestión de usuarios |
| Roles | `/roles` | Gestión de roles/permisos |

---

## 📊 Diagrama Entidad-Relación (DER)

```mermaid
erDiagram
    CATALOG ||--o{ CATALOG_ITEM : contains
    CATALOG_ITEM ||--o{ CATALOG_ITEM : "parent-child"
    
    CATALOG_ITEM ||--o{ EQUIPMENT : categoryId
    CATALOG_ITEM ||--o{ EQUIPMENT : locationId
    EQUIPMENT ||--o{ EQUIPMENT : parentEquipmentId
    
    CATALOG_ITEM ||--o{ CAMERA : locationId
    CATALOG_ITEM ||--o{ CAMERA : typeId
    CAMERA ||--o{ CAMERA_UPDATE : cameraId
    
    CATALOG_ITEM ||--o{ FILM_RECORD : requestTypeId
    CATALOG_ITEM ||--o{ FILM_RECORD : crimeTypeId
    CATALOG_ITEM ||--o{ FILM_RECORD : unitId
    CATALOG_ITEM ||--o{ FILM_RECORD : organizationId
    
    USER ||--o{ ROLE : roleIds
    ROLE ||--o{ PERMISSION : contains

    CATALOG {
        string id PK
        string name
        string code UK
        string description
        boolean isActive
    }
    
    CATALOG_ITEM {
        string id PK
        string catalogId FK
        string parentId FK
        string name
        string code
        int order
        boolean isActive
    }
    
    EQUIPMENT {
        string id PK
        string name
        string categoryId FK
        string locationId FK
        string parentEquipmentId FK
        string serialNumber
        string brand
        string model
        string status
        string qrCode
    }
    
    CAMERA {
        string id PK
        string name
        string locationId FK
        string typeId FK
        string status
        string ipAddress
        string serialNumber
    }
    
    CAMERA_UPDATE {
        string id PK
        string cameraId FK
        string type
        string description
        string date
        string status
    }
    
    FILM_RECORD {
        string id PK
        string title
        string requestTypeId FK
        string crimeTypeId FK
        string unitId FK
        string organizationId FK
        string status
    }
    
    USER {
        string uid PK
        string email
        string displayName
        array roleIds FK
        boolean isActive
    }
    
    ROLE {
        string id PK
        string name
        array permissions
        boolean isActive
    }
    
    PERMISSION {
        string module
        array actions
    }
```

---

## 📦 Modelos de Datos

### Equipment (Equipamiento)
```typescript
interface Equipment {
    id?: string;
    name: string;
    categoryId: string;           // Referencia a CatalogItem
    locationId?: string;          // Referencia a CatalogItem (ubicación)
    parentEquipmentId?: string;   // Para jerarquía de equipos
    serialNumber?: string;
    brand?: string;
    model?: string;
    status: 'Disponible' | 'En Reparación' | 'Entregado' | 'Baja';
    description?: string;
    qrCode?: string;
    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}
```

### Camera (Cámara)
```typescript
interface Camera {
    id?: string;
    name: string;
    locationId: string;           // Referencia a CatalogItem
    typeId: string;               // Referencia a CatalogItem (tipo)
    status: 'Operativa' | 'Con Falla' | 'Fuera de Servicio' | 'Mantenimiento';
    ipAddress?: string;
    serialNumber?: string;
    installationDate?: string;
    notes?: string;
    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}

interface CameraUpdate {
    id?: string;
    cameraId: string;
    type: 'Falla' | 'Reparación' | 'Mantenimiento' | 'Observación';
    description: string;
    date: string;
    reportedBy: string;
    resolvedAt?: string;
    resolvedBy?: string;
    status: 'Abierta' | 'Cerrada';
    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
}
```

### Catalog & CatalogItem (Maestros)
```typescript
interface Catalog {
    id?: string;
    name: string;                 // Ej: "Categorías", "Ubicaciones", "Tipos de Cámara"
    description?: string;
    isActive: boolean;
    createdAt: Timestamp;
}

interface CatalogItem {
    id?: string;
    catalogId: string;            // Referencia al catálogo padre
    parentId?: string;            // Para items jerárquicos
    name: string;
    code?: string;
    order: number;
    isActive: boolean;
    createdAt: Timestamp;
}
```

> [!IMPORTANT]
> **Diseño de Referencias:** Guardar siempre `IDs` de catálogo (ej: `locationId`) y no el texto. Si cambia el nombre de una opción, no cambia el histórico.

### User & Role (Seguridad)
```typescript
interface User {
    uid: string;                  // Firebase Auth UID
    email: string;
    displayName: string;
    roleIds: string[];            // Referencias a roles
    isActive: boolean;
    createdAt: Timestamp;
    lastLoginAt?: Timestamp;
}

interface Role {
    id?: string;
    name: string;                 // Ej: "Admin", "Operador", "Consulta"
    description?: string;
    permissions: Permission[];
    isActive: boolean;
}

interface Permission {
    module: string;               // Ej: "equipamiento", "camaras"
    actions: ('read' | 'create' | 'update' | 'delete')[];
}
```

---

## 🔐 Seguridad (RBAC)

### Arquitectura de Autorización

```mermaid
graph LR
    U[Usuario] --> AG[Auth Guard]
    AG --> RG[Role Guard]
    RG --> P[Página]
    RG --> FS[Firestore Rules]
```

### Guards de Angular
- **AuthGuard:** Verifica autenticación (`canActivate`)
- **RoleGuard:** Verifica permisos por rol

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: verificar rol
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid))
        .data.roleIds.hasAny([role]);
    }
    
    // Equipamiento: lectura todos, escritura solo admin/operador
    match /equipamiento/{doc} {
      allow read: if request.auth != null;
      allow write: if hasRole('admin') || hasRole('operador');
    }
    
    // Catálogos: solo admin
    match /catalogs/{doc} {
      allow read: if request.auth != null;
      allow write: if hasRole('admin');
    }
  }
}
```

---

## 🔄 Catálogos Compartidos

Los combos de todos los módulos se alimentan del sistema de **Catálogos**:

| Catálogo | Usado en |
|----------|----------|
| Categorías | Equipamiento |
| Ubicaciones | Equipamiento, Cámaras |
| Estados Equipo | Equipamiento |
| Tipos de Cámara | Cámaras |
| Tipos de Solicitud | Registros Fílmicos |
| Delitos | Registros Fílmicos |

### Jerarquía de Catálogos

Los `CatalogItem` pueden tener un `parentId` para crear jerarquías:

```
Ubicaciones
├── Edificio Central
│   ├── Planta Baja
│   └── Primer Piso
└── Edificio Anexo
    └── Depósito
```

---

## 🔄 Flujo de Datos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant G as Guard
    participant C as Componente
    participant S as Servicio
    participant F as Firestore

    U->>G: Navegar a ruta
    G->>G: Verificar auth + rol
    G->>C: Permitir acceso
    C->>S: Solicitar datos
    S->>F: Query a colección
    F-->>S: Datos + observable
    S-->>C: Datos actualizados
    C-->>U: Renderizar vista
```
