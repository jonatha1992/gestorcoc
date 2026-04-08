# ==========================================
# Etapa 1: Build de Angular (Frontend)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Aumentar memoria para builds Angular 21 en entornos con recursos limitados
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Instalar dependencias primero para aprovechar cache de capas Docker
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copiar el codigo fuente y compilar
COPY frontend/ ./
# Clean Angular and TypeScript caches to avoid stale build artifacts
RUN rm -rf .angular/cache 2>/dev/null || true
RUN rm -rf node_modules/.cache 2>/dev/null || true
RUN npm run build

# Verificar que el build produjo los archivos esperados (fail-fast)
RUN test -f /app/frontend/dist/gestor-coc/browser/index.html \
    || (echo "ERROR: Angular build did not produce expected output at dist/gestor-coc/browser/index.html" && exit 1)

# ==========================================
# Etapa 2: Django Backend (Produccion)
# ==========================================
FROM python:3.11-slim
WORKDIR /app/backend

# Env vars requeridas por Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema operativo (para PostgreSQL y gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt e instalar dependencias
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el codigo del backend
COPY backend/ ./

# Copiar los archivos estaticos pre-compilados de Angular
# Django (mediante WhiteNoise en settings.py) buscara en /app/frontend/dist/gestor-coc/browser
COPY --from=frontend-builder /app/frontend/dist/gestor-coc/browser /app/frontend/dist/gestor-coc/browser

# Recopilar estaticos de Django para WhiteNoise
# Se inyecta un DATABASE_URL ficticio porque settings.py lo exige al importarse,
# aunque collectstatic no necesita conexion real a la base de datos.
RUN DATABASE_URL="sqlite:////tmp/build.sqlite3" \
    python manage.py collectstatic --noinput

# Puerto expuesto (documentacion; Railway inyecta PORT en runtime)
EXPOSE 8000

# El CMD inicia aplicando las migraciones, sembrando si se indica la variable de entorno, y levantando Gunicorn
CMD ["sh", "-c", "PORT=${PORT:-8000}; python manage.py migrate || echo 'WARNING: migrate failed, starting server anyway'; if [ \"$SEED_ON_STARTUP\" = \"True\" ]; then python manage.py seed_data; fi; exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]
