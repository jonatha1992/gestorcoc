# ==========================================
# Etapa 1: Build de Angular (Frontend)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Instalar dependencias primero para aprovechar caché de capas
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copiar el código fuente y compilar
COPY frontend/ ./
RUN npm run build

# ==========================================
# Etapa 2: Django Backend (Producción)
# ==========================================
FROM python:3.11-slim
WORKDIR /app/backend

# Env vars requeridas por Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instalar dependencias del sistema operativo (para PostgreSQL y gcc)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt e instalar dependencias
COPY backend/requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Copiar el código del backend
COPY backend/ ./

# Pre-crear la estructura de carpetas necesaria para los estáticos de frontend
RUN mkdir -p /app/frontend/dist/gestor-coc/browser

# Copiar los archivos estáticos pre-compilados de Angular al backend
# Django (mediante WhiteNoise en settings.py) buscará en /app/frontend/dist/gestor-coc/browser
COPY --from=frontend-builder /app/frontend/dist/gestor-coc/browser /app/frontend/dist/gestor-coc/browser

# Recopilar estáticos de Django para WhiteNoise
# (No fallará por falta de BD gracias a los fallbacks del settings.py)
RUN python manage.py collectstatic --noinput

# Exponer el puerto
EXPOSE $PORT

# El CMD inicia aplicando las migraciones pendientes y levantando Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
