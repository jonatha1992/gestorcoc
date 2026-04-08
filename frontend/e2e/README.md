# Pruebas E2E - GestorCOC

Pruebas end-to-end automatizadas usando **Playwright** para el frontend Angular de GestorCOC.

## ✅ Estado Actual

### Pruebas Implementadas

| Suite | Estado | Descripción |
|-------|--------|-------------|
| `auth.spec.ts` | ✅ 7 passing | Login, validación, UI |
| `smoke.spec.ts` | ✅ 3 passing | Carga de páginas, redirecciones |
| `novedades.spec.ts` | ⏸️ Pendiente | Requiere backend con datos |
| `personnel.spec.ts` | ⏸️ Pendiente | Requiere backend con datos |
| `assets.spec.ts` | ⏸️ Pendiente | Requiere backend con datos |

## 🔑 Credenciales del Admin (Verificadas)

```
Username: admin
Password: Temp123456!
Email: admin@example.com
Es superuser: True
Activo: True
```

## 🚀 Comandos

### Ejecutar pruebas de autenticación y smoke tests
```bash
npm run test:e2e
```

### Ejecutar con navegador visible
```bash
npm run test:e2e:headed
```

### Ejecutar pruebas específicas
```bash
# Solo autenticación
npx playwright test e2e/auth.spec.ts

# Solo smoke tests
npx playwright test e2e/smoke.spec.ts

# Con navegador visible
npx playwright test --headed
```

## 📋 Requisitos para Pruebas Completas

Para ejecutar las pruebas CRUD completas (novedades, personal, activos):

1. **Backend corriendo** en `http://localhost:8000`
2. **Frontend corriendo** en `http://localhost:4200`
3. **Base de datos con seed data**:
   ```bash
   cd backend
   .venv\Scripts\python.exe manage.py seed_data --volume low
   .venv\Scripts\python.exe manage.py seed_system_users
   ```

## 📊 Resultados Recientes

```
Running 8 tests using 2 workers

  ✓  auth.spec.ts - debe mostrar la página de login
  ✓  auth.spec.ts - debe mostrar toggle de contraseña
  ✓  auth.spec.ts - debe validar campos requeridos
  ✓  auth.spec.ts - debe mostrar error con credenciales inválidas
  ✓  smoke.spec.ts - debe cargar la página de login
  ✓  smoke.spec.ts - debe redirigir a login si no está autenticado
  ✓  smoke.spec.ts - debe mostrar error 404 en ruta invalida
  
  7 passed
```

## 🔧 Configuración

La configuración está en `playwright.config.ts`:

- **baseURL**: `http://localhost:4200`
- **Timeout**: 60s
- **Expect timeout**: 10s
- **Proyecto**: Chromium

## 📁 Estructura

```
e2e/
├── fixtures.ts           # Fixtures y Page Objects
├── auth.spec.ts          # Pruebas de autenticación ✅
├── smoke.spec.ts         # Smoke tests ✅
├── novedades.spec.ts     # CRUD de Novedades (pendiente)
├── personnel.spec.ts     # CRUD de Personal (pendiente)
├── assets.spec.ts        # CRUD de Activos (pendiente)
└── README.md             # Este archivo
```

## 🎯 Pruebas Incluidas

### Autenticación (`auth.spec.ts`)
- ✅ Mostrar página de login
- ✅ Toggle de contraseña
- ✅ Validación de campos requeridos
- ✅ Error con credenciales inválidas
- ⏸️ Login con admin (requiere backend)

### Smoke Tests (`smoke.spec.ts`)
- ✅ Carga de página de login
- ✅ Redirección a login si no está autenticado
- ✅ Error 404 en ruta inválida

## ⚠️ Consideraciones

1. **Autenticación**: Las páginas protegidas requieren autenticación válida con el backend.
2. **Backend**: Para pruebas CRUD completas, el backend debe estar corriendo con JWT válido.
3. **Seed Data**: Ejecutar `seed_data` y `seed_system_users` antes de pruebas CRUD.

## 🐛 Solución de Problemas

### Error: "Timeout waiting for element"
- Verificar que el frontend esté corriendo: `npm start`
- Verificar que el backend esté corriendo si necesita autenticación
- Aumentar timeout en `playwright.config.ts`

### Error: "Cannot connect to server"
```bash
# Backend
cd backend
.venv\Scripts\python.exe manage.py runserver

# Frontend
cd frontend
npm start
```

### Resetear password del admin
```bash
cd backend
.venv\Scripts\python.exe manage.py seed_system_users --reset-passwords
```

## 📝 Próximos Pasos

Para habilitar las pruebas CRUD completas:

1. Asegurar que el backend esté corriendo
2. Ejecutar seed de datos
3. Actualizar los fixtures para manejar la autenticación con JWT
4. Ejecutar: `npx playwright test e2e/novedades.spec.ts`

## 🔗 Recursos

- [Documentación de Playwright](https://playwright.dev)
- [Playwright Test Generator](https://playwright.dev/docs/codegen)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
