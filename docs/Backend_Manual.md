# Manual del Backend - GestorCOC

## Tecnologías
- **Django 5.x**: Framework principal.
- **Django REST Framework (DRF)**: Para la capa API.
- **drf-spectacular**: Generación de esquemas OpenAPI 3.
- **WhiteNoise**: Servido de archivos estáticos (incluyendo el build de Angular).

## Estructura de Apps
- `assets`: Inventario (Unit, System, Server, Camera, Gear).
- `personnel`: Gestión de personas (Internal/External).
- `records`: Lógica de registros fílmicos, IA y Dashboards.
- `hechos`: Bitácora de incidentes.
- `novedades`: Reporte de fallas técnicas.

## Servicios (Service Layer)
Siguiendo los principios del proyecto, la lógica compleja reside en `services.py` de cada app (ej: `records/services.py`).
- **IntegrityService**: Maneja cálculos de hash, generación de PDF/DOCX e integración con IA.

## Integración con IA
El backend soporta múltiples proveedores con fallback automático:
1.  Gemini (Google)
2.  Groq
3.  OpenRouter
4.  Ollama (Local)

Configurar llaves en `backend/.env`.

## Comandos Útiles
Referirse al documento **[Runbooks.md](./Runbooks.md)**.
