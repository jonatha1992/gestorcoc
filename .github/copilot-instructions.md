<<<<<<< HEAD
# AI Coding Assistant Instructions for GestorCOC
=======
﻿# AI Coding Assistant Instructions for GestorCOC
>>>>>>> dev

## Project Overview
GestorCOC is a Django-based monolithic web application for managing CCTV systems, operations, and documentation in security control centers. It serves multiple organizational units with role-based access control.

## Architecture
- **Framework**: Django 5.x with MVT pattern
- **Frontend**: Django Templates + Tailwind CSS + Alpine.js
- **Database**: SQLite (development), designed for relational integrity
- **Language**: Spanish (Argentina timezone)
- **Structure**: 5 main apps (core, inventory, operations, documents, utilities)

## Key Components

### Core App (Authentication & Organization)
- Custom User model extending AbstractUser with roles/groups
<<<<<<< HEAD
- Organizational hierarchy: Units → Systems → Cameras
=======
- Organizational hierarchy: Units  Systems  Cameras
>>>>>>> dev
- Catalog system for dropdowns (locations, categories, types)
- Custom RBAC with JSON-based permissions
- Audit mixins for all models (created_by, updated_by, timestamps)

### Data Models Relationships
```
OrganizationalUnit
<<<<<<< HEAD
├── CctvSystem (has_coc_room flag)
│   └── Camera (status: Online/Issue/Offline/Maintenance)
└── Equipment (categorized, with QR codes)

Operations (Hechos/Incidents)
├── Linked to CctvSystem/Camera
├── Resolved by groups/users
└── Status tracking with resolution times

Documents
├── Official records (Entrada/Salida)
├── Film records for evidence requests
└── File attachments with integrity checks
=======
 CctvSystem (has_coc_room flag)
    Camera (status: Online/Issue/Offline/Maintenance)
 Equipment (categorized, with QR codes)

Operations (Hechos/Incidents)
 Linked to CctvSystem/Camera
 Resolved by groups/users
 Status tracking with resolution times

Documents
 Official records (Entrada/Salida)
 Film records for evidence requests
 File attachments with integrity checks
>>>>>>> dev
```

## Development Patterns

### Permissions System
```python
# Check permissions in views
class MyView(ModulePermissionRequiredMixin):
    module = "hechos"  # matches role permissions
    action = "create"

# Template usage
{% load permissions %}
{% if has_permission "camaras" "update" %}...{% endif %}
```

### Model Patterns
- All models include audit fields (created_by, updated_by, created_at, updated_at)
- Foreign keys use SET_NULL for data integrity
- Extensive use of choices (TextChoices) for status fields
- Database indexes on frequently queried fields (status, dates, foreign keys)

### Form Handling
- Custom forms with validation
- Audit mixins automatically set user fields
- Server-side validation with detailed error messages

### Data Import/Export
- Excel/CSV import with openpyxl
- Data validation and normalization
- Checksum verification for integrity
- Bulk operations with progress tracking

## Critical Workflows

### Incident Management (Hechos)
1. Detection by Guardia/Monitoreo
2. Recording with system/camera links
3. Assignment to resolution groups
4. Status tracking (Abierto/Cerrado)
5. Resolution time calculation

### Equipment Lifecycle
1. Registration with catalog categories
2. Status changes (Available/Repair/Delivered/Retired)
3. QR code generation for tracking
4. Maintenance history

### Document Workflow
1. Entry/Exit classification
2. Priority assignment (Baja/Media/Alta)
<<<<<<< HEAD
3. Status progression (Pendiente → En Proceso → Finalizado)
=======
3. Status progression (Pendiente  En Proceso  Finalizado)
>>>>>>> dev
4. Attachment handling

## Commands & Setup
```bash
# Initial setup
python manage.py migrate
python manage.py seed_roles
python manage.py seed_catalogs
python manage.py seed_demo_data

# Development server
python manage.py runserver

# Testing
python manage.py test
```

## Mobile Optimization
- Responsive design with Tailwind breakpoints
- Compact layouts for small screens
- Horizontal scrolling navigation
- Touch-friendly button sizing
- QR codes scaled appropriately

## Code Style Notes
- Spanish field names and comments
- Extensive model relationships
- Custom management commands for data seeding
- Template tags for permission checks
- Mixins for common functionality
- Dataclasses for import processing

## Common Patterns
- Use `get_or_create` for catalog items
- Always include audit fields in forms
- Check permissions before actions
- Use database transactions for related operations
- Validate file integrity with hashes
- Handle timezone-aware datetimes

## Testing Approach
- Django TestCase with Client
- Test authentication and permissions
- Verify model relationships
- Check form validation
- Test import/export functionality

## Deployment Considerations
- Environment variables for secrets
- Static files collection
- Database backups
- Media file handling
<<<<<<< HEAD
- Permission synchronization</content>
<parameter name="filePath">c:\Repositorio\gestorcoc\.github\copilot-instructions.md
=======
- Permission synchronization

## GitHub Copilot Skills
This project includes 10 specialized skills for enhanced development assistance:
- architect-pro, devops-engine, uml-docs-architect, data-excel-pro
- creative-innovator, tester-pro, refactor-pro, performance-tuner
- lead-reviewer, security-guardian

See `.github/skills/` for detailed skill definitions.
>>>>>>> dev
