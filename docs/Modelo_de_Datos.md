# Modelo de Datos - GestorCOC v2.0

> **Estrategia**: Base de datos relacional estricta para garantizar la integridad referencial.
> **Motor Sugerido**: SQLite (Dev/Small Apps) o PostgreSQL (Prod).

## 1. Diagrama Entidad-Relación (DER)

```mermaid
erDiagram
    %% INFRAESTRUCTURA
    Asset_System ||--|{ Asset_Camera : contains
    Asset_System {
        int id pk
        string name "VMS/NVR Name"
        string ip_address
        string location
        string status "Online/Offline"
    }
    Asset_Camera ||--o{ Novedad_Log : generates
    Asset_Camera {
        int id pk
        int system_id fk
        string name "Camera Name"
        string ip_address
        int channel_number
        string status "Active/Fault/Offline"
    }
    Asset_Hardware ||--o{ Novedad_Log : generates
    Asset_Hardware {
        int id pk
        string type "Monitor, PC, UPS"
        string qr_code "Unique ID"
        string status
    }

    %% NOVEDADES
    Novedad_Log {
        int id pk
        int asset_id fk "Polymorphic or specific FK"
        string type "Falla, Mantenimiento"
        string description
        datetime created_at
        int reported_by_user_id fk
        string external_ticket_id "DGT/CCO Link"
    }

    %% REGISTROS FÍLMICOS
    Film_Request ||--|{ Film_Asset_Link : includes
    Asset_Camera ||--o{ Film_Asset_Link : recorded_in
    Film_Request {
        int id pk
        string case_number "Causa/Oficio"
        string case_type
        int requested_by_user_id fk
        string status "Pending, Verified, Delivered"
        datetime created_at
    }
    Film_Backup {
        int id pk
        int request_id fk
        string physical_path
        string file_hash "SHA256"
        int verified_by_user_id fk
    }
    Film_Request ||--o| Film_Backup : results_in

    %% PERSONAL y ACCESOS
    Personnel ||--o{ Access_Log : logs
    Personnel ||--o{ Competency_Matrix : has
    Personnel {
        int id pk
        string full_name
        string dni
        string type "Staff, Visit, Tech"
        bool is_active
    }
    Access_Log {
        int id pk
        int personnel_id fk
        datetime entry_time
        datetime exit_time
        string motive
    }
    Competency_Matrix {
        int id pk
        int personnel_id fk
        string competency_name
        date certified_date
    }
```

## 2. Diccionario de Datos

### 2.1 Tablas Principales

#### `Asset_Camera` (Cámaras)
*   **id**: PRIMARY KEY
*   **system_id**: FOREIGN KEY -> `Asset_System(id)`
*   **name**: VARCHAR(100). Nombre lógico (ej: "Camara Acceso Principal").
*   **ip_address**: VARCHAR(45).
*   **status**: ENUM('OK', 'FAIL', 'OFFLINE'). Estado actual derivado de la última novedad.

#### `Novedad_Log` (Fallas/Eventos)
*   **asset_id**: Referencia al equipo afectado.
*   **external_ticket_id**: VARCHAR(50). NULLABLE. ID del ticket en DGT/CCO si corresponde.
*   **severity**: ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').
*   **state**: ENUM('OPEN', 'CLOSED').

#### `Film_Backup` (Evidencia Digital)
*   **request_id**: FOREIGN KEY -> `Film_Request(id)`.
*   **physical_path**: TEXT. Ruta absoluta en el storage (ej: `/mnt/storage/2026/01/Causa_555`).
*   **file_hash**: VARCHAR(64). Hash SHA-256 del archivo masivo (.zip o .dav).
*   **hash_verified_at**: DATETIME. NULL si no está verificado.

#### `Personnel` (Personas)
*   **dni**: UNIQUE INDEX.
*   **is_whitelist**: BOOLEAN. Si está en la lista blanca de acceso automático.
