---
name: deploy_local
description: Levanta el entorno de desarrollo completo (Backend + Frontend).
---

# Skill: Local Deployment

Levanta ambos servidores (API y SPA) con comunicación activada.

## Backend (API)
- Puerto: 8000
- Comando:
  ```powershell
  cd backend
  .\.venv\Scripts\python.exe manage.py runserver
  ```

## Frontend (Angular)
- Puerto: 4200 (Proxy a 8000)
- Comando:
  ```powershell
  cd frontend
  npm start
  ```

## Acceso Rápido
- **App**: `http://localhost:4200`
- **Swagger**: `http://localhost:8000/api/schema/swagger-ui/`
