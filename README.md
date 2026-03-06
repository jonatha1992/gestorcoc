# GestorCOC

Sistema integral de gestión para Centros de Operaciones y Control (COC) - Gestión de sistemas CCTV, operaciones, incidentes y documentación.

## 📋 Descripción

GestorCOC es una aplicación web monolítica desarrollada en Django con frontend Angular, diseñada específicamente para la gestión centralizada de:

- 📹 Inventario de sistemas CCTV y cámaras
- 🚨 Registro y seguimiento de incidentes (Hechos)
- 📝 Documentación oficial (Entrada/Salida de documentos)
- 🎬 Registros fílmicos para solicitudes de evidencia
- 📦 Equipamiento y recursos del centro de control
- 👥 Personal y gestión de turnos
- 📊 Reportes y análisis de operaciones

## 🏗️ Arquitectura

```
gestorcoc/
├── backend/              # Django 5.x
│   └── src/
│       ├── config/       # Configuración del proyecto
│       ├── core/         # Autenticación y organización
│       ├── assets/       # Inventario CCTV
│       ├── hechos/       # Gestión de incidentes
│       ├── records/      # Documentación oficial
│       ├── novedades/    # Novedades del sistema
│       └── personnel/    # Gestión de personal
├── frontend/             # Angular + Tailwind CSS
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   ├── pages/
│       │   └── services/
│       └── environments/
├── data/                 # Datos de importación
├── docs/                 # Documentación técnica
└── .github/
    ├── copilot-instructions.md
    └── skills/           # GitHub Copilot Skills
```

## 🚀 Tecnologías

### Backend

- **Framework:** Django 5.x
- **Base de datos:** PostgreSQL
- **API:** Django REST Framework
- **Autenticación:** Sistema personalizado basado en roles

### Frontend

- **Framework:** Angular 17+
- **Estilos:** Tailwind CSS
- **UI Reactiva:** Alpine.js (componentes ligeros)
- **HTTP Client:** Angular HttpClient

### Características especiales

- Sistema RBAC con permisos basados en JSON
- Auditoría completa (created_by, updated_by, timestamps)
- Sistema de catálogos para dropdowns estandarizados
- Generación de códigos QR para equipamiento
- Importación/exportación de datos Excel/CSV
- Zona horaria: Argentina (UTC-3)
- Idioma: Español

## 📦 Instalación

### Prerequisitos

- Python 3.11+
- Node.js 18+
- npm o yarn

### Backend (Django)

```bash
cd backend/src

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r ../requirements.txt

# Migraciones
python manage.py migrate

# Cargar datos iniciales
python manage.py seed_roles
python manage.py seed_catalogs
python manage.py seed_demo_data  # Opcional: datos de prueba

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### Frontend (Angular)

```bash
cd frontend

# Instalar dependencias
npm install

# Desarrollo
npm start

# Build producción
npm run build
```

## 🔑 Características Principales

### Sistema de Permisos

- Roles: Administrador, Supervisor, Operador, Monitoreo
- Permisos granulares por módulo (crear, leer, actualizar, eliminar)
- Sistema de grupos para gestión de incidentes

### Gestión de CCTV

- Unidades organizacionales jerárquicas
- Sistemas CCTV con indicador de sala COC
- Cámaras con estados: Online/Con Fallas/Offline/Mantenimiento
- Vista de salud del sistema en tiempo real

### Gestión de Incidentes (Hechos)

- Detección por Guardia/Monitoreo
- Vinculación a sistemas y cámaras
- Asignación a grupos de resolución
- Tracking de estados y tiempos de resolución
- Reportes y análisis

### Documentación

- Registros de entrada/salida
- Clasificación por prioridad
- Estados de seguimiento
- Adjuntos con verificación de integridad

## 🤖 GitHub Copilot Skills

Este proyecto incluye 10 skills especializadas para GitHub Copilot que mejoran la experiencia de desarrollo:

- 🏗️ **architect-pro** - Arquitectura y diseño de sistemas
- 🚀 **devops-engine** - DevOps y despliegue
- 📐 **uml-docs-architect** - Documentación y UML
- 📊 **data-excel-pro** - Gestión de datos y Excel
- 💡 **creative-innovator** - Innovación y creatividad
- 🧪 **tester-pro** - Testing y pruebas
- ♻️ **refactor-pro** - Refactorización de código
- ⚡ **performance-tuner** - Rendimiento y escalabilidad
- 👁️ **lead-reviewer** - Revisión de código
- 🔒 **security-guardian** - Seguridad

Ver [.github/skills/README.md](.github/skills/README.md) para más detalles.

## 📚 Documentación

La documentación técnica completa se encuentra en la carpeta `docs/`:

- [Arquitectura.md](docs/Arquitectura.md) - Diseño del sistema
- [Modelo_de_Datos.md](docs/Modelo_de_Datos.md) - Estructura de la base de datos
- [Casos_de_Uso.md](docs/Casos_de_Uso.md) - Flujos de trabajo
- [Documentacion_GestorCOC.md](docs/Documentacion_GestorCOC.md) - Guía completa

## 🧪 Testing

```bash
# Backend
cd backend/src
python manage.py test

# Frontend
cd frontend
npm test
```

## 🔧 Comandos Útiles

```bash
# Importar datos de Excel
python manage.py import_cameras data/camaras.xlsx

# Generar códigos QR
python manage.py generate_qr_codes

# Backup de base de datos
python manage.py dumpdata > backup.json

# Verificar integridad
python manage.py check
```

## 📱 Optimización Móvil

- Diseño responsive con Tailwind CSS
- Navegación táctil optimizada
- Layouts compactos para pantallas pequeñas
- Códigos QR escalables
- Formularios amigables para móvil

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- **Python:** PEP 8, Django coding style
- **TypeScript/Angular:** Angular style guide
- **Commits:** Conventional Commits (Add:, Fix:, Refactor:, etc.)
- **Idioma:** Español para nombres de campos, comentarios y documentación

## 📄 Licencia

Este proyecto es privado y propiedad de [Tu Organización].

## 👨‍💻 Autor

**Jonathan** - [@jonatha1992](https://github.com/jonatha1992)

## 📞 Soporte

Para soporte o consultas, contactar a través de los issues del repositorio.

---

**Versión:** 1.0.0  
**Última actualización:** Febrero 2026
