# Runbook: Despliegue en Railway

## Prerrequisitos

- Cuenta en Railway.app.
- Variables de entorno configuradas: `DATABASE_URL`, `SECRET_KEY` y las claves de IA que correspondan.
- El despliegue usa el `Dockerfile` ubicado en el root del repositorio.

## Flujo real de despliegue

1. **Build**
   - Railway detecta el `Dockerfile`.
   - La etapa `frontend-builder` ejecuta `npm ci` y `npm run build`.
   - El build esperado queda en `/app/frontend/dist/gestor-coc/browser`.
2. **Imagen final Django**
   - Instala `backend/requirements.txt`.
   - Copia `backend/`.
   - Copia el build Angular dentro de `/app/frontend/dist/gestor-coc/browser`.
   - Ejecuta `collectstatic`.
3. **Runtime**
   - Al iniciar el contenedor se ejecuta `python manage.py migrate`.
   - Luego se levanta `gunicorn config.wsgi:application`.
4. **Serving**
   - WhiteNoise sirve el build Angular.
   - Django resuelve `/api/...` y el catch-all SPA para el resto de rutas.
   - `frontend/src/environments/environment.production.ts` usa `apiUrl: ''`, por lo que frontend y backend trabajan en same-origin.

## Verificacion

- Acceder a la URL de Railway.
- Verificar el endpoint `/api/health/`.
- Comprobar que `/login` renderice desde el servidor.
- Iniciar sesion y verificar que las llamadas viajen a `/api/...` sin cambiar de dominio.
- Comprobar que los assets estaticos carguen correctamente.

## Validacion previa recomendada

```bash
cd backend
.venv\Scripts\python.exe -m pip install --dry-run -r requirements.txt

cd ..
docker build -t gestorcoc:local .
```
