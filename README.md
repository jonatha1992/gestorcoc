# GestorCOC v2.0

> **Visión 2026**: Centralización Operativa y Trazabilidad de Evidencia.

Sistema integral para la gestión de Centros de Operaciones y Control (COC), enfocado en la administración de inventario CCTV y la trazabilidad forense de evidencia digital (Registros Fílmicos).

---

## 🚀 Características Principales

### 1. Gestión de Infraestructura (CCTV)

* **Inventario Detallado**: Registro de NVRs, Cámaras y Equipamiento Auxiliar.
* **Búsqueda Rápida**: Localización de activos por IP, Nombre o Ubicación en tiempo real.
* **Estado de Salud**: Monitoreo de operatividad (Online/Offline) y reportes de falla integrados.

### 2. Evidencia Digital y Cadena de Custodia

* **Registros Fílmicos**: Solicitudes de preservación de video asociadas a causas judiciales.
* **Auditoría Forense**: Validación de integridad mediante Hashes y certificaciones de entrega.
* **Retención**: Políticas automáticas de gestión del ciclo de vida de la evidencia.

### 3. Operatividad

* **Gestión de Personal**: Legajos digitales, competencias y control de asistencia.
* **Seguridad Física**: Control de acceso a salas y libros de guardia digitales.
* **Soporte Externo**: Integración con mesas de ayuda externas (DGT/CCO) mediante tickets.

---

## 🛠️ Arquitectura Técnica

El sistema utiliza una arquitectura desacoplada moderna, priorizando la robustez y la escalabilidad:

* **Backend**: Python / Django 4.2+ (Django REST Framework).
* **Frontend**: Angular 19+ con TailwindCSS.
* **Base de Datos**: SQLite (Desarrollo) / Oracle Database (Producción).
* **Documentación**: OpenAPI 3.0 (Swagger) y ReDoc para la API.

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

* **Python**: 3.10 o superior.
* **Node.js**: 18 o superior (LTS recomendado).
* **Base de Datos**: SQLite (incluido por defecto) u Oracle Client (para producción).

### 1. Backend (API Django)

```bash
# Navegar al directorio del backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Navegar al directorio fuente y ejecutar migraciones
cd src
python manage.py migrate

# Iniciar servidor de desarrollo
python manage.py runserver
```

* **API URL**: `http://localhost:8000`
* **Documentación Swagger**: `http://localhost:8000/api/schema/swagger-ui/`

### 2. Frontend (Cliente Angular)

```bash
# Navegar al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

* **Aplicación URL**: `http://localhost:4200`
* **Credenciales por defecto**: (Consultar documentación interna o crear superusuario en backend)

---

## 📂 Estructura del Proyecto

```
gestorcoc/
├── backend/            # API REST (Django + DRF)
│   ├── src/
│   │   ├── config/     # Configuración global del proyecto
│   │   ├── core/       # Modelos base, mixins y utilidades compartidas
│   │   ├── assets/     # Gestión de Activos e Inventario CCTV
│   │   ├── records/    # Gestión de Evidencia y Registros Fílmicos
│   │   ├── novedades/  # Gestión de Fallas y Reportes
│   │   └── verify_api.py # Scripts de validación
│   └── requirements.txt
├── frontend/           # Single Page Application (Angular 19)
│   ├── src/app/
│   │   ├── core/       # Servicios singleton, guardas e interceptores
│   │   ├── shared/     # Componentes UI reutilizables (Tailwind)
│   │   └── features/   # Módulos funcionales (Inventario, Novedades, etc.)
│   └── package.json
├── docs/               # Fuente de Verdad (Documentación Funcional y Técnica)
└── README.md
```

## 🤝 Guía de Contribución

Para garantizar la calidad y mantenibilidad del proyecto, siga estrictamente las siguientes reglas:

1. **Documentation First**: Antes de codificar, verifique y actualice la documentación en la carpeta `docs/`. Es la **Fuente de Verdad**.
2. **Idioma**:
    * **Código**: Inglés (Variables, Funciones, Clases, Comentarios técnicos).
    * **UI y Negocio**: Español (Textos visibles, Nombres de módulos en documentación).
3. **Clean Code**:
    * Respetar principios SOLID.
    * Usar servicios para la lógica de negocio (no en Vistas/Controladores).
    * Tipado estricto en Backend (Type Hints) y Frontend (TypeScript).

---
*Generado por Antigravity para el equipo de desarrollo de GestorCOC.*
