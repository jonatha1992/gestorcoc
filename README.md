# 📦 Angular Equipamiento - Sistema de Gestión CREV

Sistema web para la gestión de equipamiento y registros fílmicos del Centro de Registros Especializados de Video (CREV).

## 🚀 Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Angular](https://angular.dev/) | 21.0.0 | Framework Frontend |
| [Firebase](https://firebase.google.com/) | 12.7.0 | Backend-as-a-Service |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.18 | Framework de Estilos |
| [Vitest](https://vitest.dev/) | 4.0.8 | Testing |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.2 | Lenguaje |

## 📋 Características

### Módulo de Equipamiento
- ✅ CRUD completo de equipos
- ✅ Estados: Disponible, En Reparación, Entregado, Baja
- ✅ Información detallada: marca, modelo, número de serie

### Módulo de Registros Fílmicos
- ✅ CRUD completo de registros
- ✅ Estados: Pendiente, En Proceso, Finalizado
- ✅ Información judicial completa

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/jonatha1992/equipamiento.git
cd equipamiento

# Instalar dependencias
npm install
```

## 💻 Desarrollo

```bash
# Iniciar servidor de desarrollo
ng serve
# o
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## 🧪 Testing

```bash
# Ejecutar tests unitarios
ng test
# o
npm test
```

## 🏗️ Build

```bash
# Build de producción
ng build

# Build de desarrollo
ng build --configuration development
```

Los archivos se generan en el directorio `dist/`.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/    # Componentes reutilizables
│   ├── models/        # Interfaces y tipos
│   ├── pages/         # Páginas/Vistas
│   └── services/      # Servicios de datos
├── environments/      # Configuración por ambiente
└── styles.css         # Estilos globales
```

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](docs/ARCHITECTURE.md) | Estructura del sistema y flujo de datos |
| [Tech Stack](docs/TECH_STACK.md) | Tecnologías y dependencias |
| [Planning](docs/PLANNING.md) | Roadmap y funcionalidades futuras |
| [Firebase Setup](FIREBASE_SETUP.md) | Configuración de Firebase |
| [Mobile Optimizations](MOBILE_OPTIMIZATIONS.md) | Optimizaciones para móviles |

## ☁️ Despliegue

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar hosting
firebase init hosting

# Build y deploy
npm run build
firebase deploy
```

La aplicación estará disponible en: `https://crev-system.web.app`

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run watch` | Build con watch mode |
| `npm test` | Ejecuta tests unitarios |

## 📝 Licencia

Proyecto privado - Todos los derechos reservados.

## 👥 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
