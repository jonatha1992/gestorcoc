# 🛠️ Stack Tecnológico

## Resumen

Tecnologías utilizadas en el proyecto **Angular Equipamiento**.

---

## 📊 Visión General

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework Frontend | Angular | 21.0.0 |
| Lenguaje | TypeScript | 5.9.2 |
| Backend-as-a-Service | Firebase | 12.7.0 |
| Firebase SDK Angular | @angular/fire | 20.0.1 |
| Estilos | Tailwind CSS | 4.1.18 |
| Testing | Vitest | 4.0.8 |
| Gestor de Paquetes | npm | 11.6.2 |

---

## 🎯 Frontend

### Angular 21
- **Características utilizadas:**
  - Standalone Components (arquitectura sin módulos)
  - Signals (reactividad moderna)
  - inject() function para DI
  - Route Guards para protección de rutas

### TypeScript
- **Versión:** 5.9.2
- **Strict mode habilitado**

---

## ☁️ Backend (Firebase)

### Colecciones Firestore

#### Principales
| Colección | Descripción |
|-----------|-------------|
| `equipamiento` | Equipos registrados |
| `registros_filmicos` | Registros fílmicos |
| `camaras` | Cámaras de vigilancia |
| `camara_novedades` | Novedades por cámara (o subcolección) |

#### Maestros/Catálogos
| Colección | Descripción |
|-----------|-------------|
| `catalogs` | Definición de catálogos |
| `catalog_items` | Ítems de cada catálogo |

#### Seguridad
| Colección | Descripción |
|-----------|-------------|
| `users` | Usuarios del sistema |
| `roles` | Roles con permisos |

---

## 🔐 Autenticación

### Método de Login
- **Email/Password** (recomendado para entorno corporativo)
- Google Sign-In (opcional)

### Estructura de Usuario
```typescript
{
  uid: string;          // Firebase Auth UID
  email: string;
  displayName: string;
  roleIds: string[];    // ["admin", "operador"]
  isActive: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
```

---

## 🔒 Seguridad

### RBAC (Role-Based Access Control)

| Rol | Permisos |
|-----|----------|
| Admin | CRUD total + gestión de usuarios y catálogos |
| Operador | CRUD equipamiento, cámaras, registros |
| Consulta | Solo lectura |

### Firestore Rules (Ejemplo)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid))
        .data.roleIds.hasAny([role]);
    }
    
    // Equipamiento
    match /equipamiento/{doc} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('operador');
    }
    
    // Catálogos - solo admin
    match /catalogs/{doc} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin');
    }
    
    // Usuarios - solo admin
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin');
    }
  }
}
```

### Auditoría
Campos estándar en todas las entidades:
```typescript
{
  createdAt: Timestamp;
  createdBy: string;      // UID del usuario
  updatedAt?: Timestamp;
  updatedBy?: string;
}
```

---

## 🎨 Estilos

### Tailwind CSS v4
```css
@import "tailwindcss";
```

### PostCSS
- `@tailwindcss/postcss` (4.1.18)
- `autoprefixer` (10.4.23)

---

## 🧪 Testing

### Vitest
- **Versión:** 4.0.8
- Unit testing de componentes y servicios

```bash
ng test
```

---

## 📦 Dependencias

### Producción
```json
{
  "@angular/common": "^21.0.0",
  "@angular/core": "^21.0.0",
  "@angular/fire": "^20.0.1",
  "@angular/forms": "^21.0.0",
  "@angular/router": "^21.0.0",
  "firebase": "^12.7.0",
  "rxjs": "~7.8.0"
}
```

### Desarrollo
```json
{
  "@angular/build": "^21.0.4",
  "@angular/cli": "^21.0.4",
  "tailwindcss": "^4.1.18",
  "typescript": "~5.9.2",
  "vitest": "^4.0.8"
}
```

---

## 🌐 Compatibilidad

- Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- ES2022+
- HTTPS requerido para autenticación
