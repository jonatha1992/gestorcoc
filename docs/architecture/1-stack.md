# Stack Tecnológico Detallado

## Backend
- **Framework**: Django 5.2 + DRF.
- **Base de Datos**: PostgreSQL con `dj-database-url` en todos los entornos.
- **Documentación API**: `drf-spectacular` (Swagger/ReDoc).
- **Servicios**:
  - `python-docx` / `reportlab`: Generación de informes.
  - `hashlib`: Algoritmos de integridad.

## Frontend
- **Framework**: Angular 21 (Standalone Components).
- **UI/UX**: Tailwind CSS v4 para estilos atómicos y rápidos.
- **Gráficos**: `apexcharts` (vía `ng-apexcharts`).
- **Utilidades**: `xlsx` para reportes Excel, `crypto-js` para seguridad local.

## Inteligencia Artificial (IA)
- Gestión de modelos vía `records/services.py`.
- Integración con:
  - Gemini 1.5 Pro/Flash.
  - OpenRouter (acceso a modelos Claude, GPT).
  - Groq (Llama 3 p/ baja latencia).
  - Ollama (soporte local).
