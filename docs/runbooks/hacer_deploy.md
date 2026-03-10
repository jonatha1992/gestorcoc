# Runbook: Despliegue en Railway

## Prerrequisitos
- Cuenta en Railway.app.
- Variables de entorno configuradas (`DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`).

## Pasos de Despliegue
1. **Build**: Railway detecta el `Dockerfile` en el root.
2. **Backend**:
   - `python manage.py migrate` se ejecuta como post-build.
   - `gunicorn config.wsgi` levanta el proceso.
3. **Frontend**:
   - `npm run build` genera `dist/frontend/browser`.
   - Django (WhiteNoise) sirve estos archivos automáticamente.

## Verificación
- Acceder a la URL de Railway.
- Verificar el endpoint `/api/health/`.
- Comprobar que los assets estáticos carguen correctamente.
