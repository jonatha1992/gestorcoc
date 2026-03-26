# Documentación — GestorCOC

> **GestorCOC** es una plataforma integral para el control operativo de Centros de Operaciones y Control (COC). Integra la gestión de inventario CCTV, bitácora operativa, cadena de custodia de evidencia digital y análisis con Inteligencia Artificial.

---

## 📚 Índice

> ⭐ **[Documentación General del Sistema (archivo único completo)](./GestorCOC-Documentacion-General.md)** — arquitectura, casos de uso, requisitos, modelo de datos, roles, API y más.

---

| # | Documento | Descripción |
|---|-----------|-------------|
| 1 | [Visión General de Arquitectura](./architecture/0-overview.md) | Diseño del sistema, capas y diagrama de bloques |
| 2 | [Stack Tecnológico](./architecture/1-stack.md) | Tecnologías utilizadas en backend, frontend e IA |
| 3 | [Módulos del Sistema](./architecture/3-modulos.md) | Apps Django, rutas Angular, casos de uso y modelo de datos |
| 4 | [Roles y Permisos](./architecture/2-roles-and-permissions.md) | Matriz RBAC completa: roles, permisos y flujo de autenticación |
| 5 | [Planning y Estado](./PLANNING.md) | Estado actual por módulo y tareas completadas |
| 6 | [Decisiones Arquitectónicas (ADRs)](./decisions/01-usar-postgressql.md) | Registro de decisiones técnicas clave |
| 7 | [Guía de Deploy](./runbooks/hacer_deploy.md) | Pasos para despliegue en Railway |
| 8 | [Diagramas UML](./diagrams/) | Fuentes PlantUML: arquitectura, secuencias, modelo de datos |

---

## ⚡ Inicio Rápido

### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (Angular)
```bash
cd frontend
npm install
npm start       # Puerto 4200, conecta con API en :8000
```

### Seed de datos
```powershell
.\tools\scripts\seed_db.ps1
```

---

## 🏗️ Arquitectura en una oración

El backend Django expone una **API REST** (DRF) consumida por una **SPA Angular**. Ambos conviven en el mismo proceso en producción (Railway), donde WhiteNoise sirve los estáticos del build de Angular.

---

*Última actualización: marzo 2026*
