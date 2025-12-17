# Sistema de Gestión de Equipamiento con QR

Sistema web moderno desarrollado con React + TypeScript para gestionar equipamiento con códigos QR, escaneo mediante cámara, y control de entregas/recepciones.

## 🚀 Características

- ✅ **ABM de Equipamiento**: Alta, Baja y Modificación de equipos
- 📱 **Códigos QR**: Generación automática al dar de alta
- 📷 **Escaneo con Cámara**: Lee códigos QR con la cámara del dispositivo
- 🖨️ **Impresión de QR**: Genera PDF para imprimir y pegar en el equipamiento
- 📤 **Sistema de Entrega**: Checklist con escaneo de QR
- 📥 **Sistema de Recepción**: Verificación de equipos recibidos vs entregados
- 🔥 **Firebase**: Almacenamiento en tiempo real con Firestore
- 🎨 **Diseño Mobile-First**: Interfaz optimizada para dispositivos móviles
- 📊 **Vista Horizontal**: Lista de equipos en formato tabla compacto

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Firebase (para producción)

## 🛠️ Instalación

1. **Clonar el repositorio** (si aplica) o navegar a la carpeta del proyecto

2. **Instalar dependencias**:

```bash
npm install
```

3. **Configurar Firebase**:
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Firestore Database
   - Copiar las credenciales de configuración
   - Editar `src/config/firebase.ts` y reemplazar con tus credenciales:

   ```typescript
   const firebaseConfig = {
     apiKey: "TU_API_KEY",
     authDomain: "TU_PROJECT_ID.firebaseapp.com",
     projectId: "TU_PROJECT_ID",
     storageBucket: "TU_PROJECT_ID.appspot.com",
     messagingSenderId: "TU_MESSAGING_SENDER_ID",
     appId: "TU_APP_ID"
   };
   ```

## 🚀 Uso

### Desarrollo Local

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

### Preview del Build

```bash
npm run preview
```

## 🔥 Despliegue en Firebase

1. **Instalar Firebase CLI**:

```bash
npm install -g firebase-tools
```

2. **Login en Firebase**:

```bash
firebase login
```

3. **Inicializar Firebase** (si no está inicializado):

```bash
firebase init hosting
```

- Selecciona tu proyecto de Firebase
- Directorio público: `dist`
- Configurar como SPA: `Yes`
- No sobrescribir index.html

4. **Desplegar**:

```bash
npm run build
firebase deploy
```

## 📱 Uso de la Aplicación

### 1. Dar de Alta Equipamiento

1. Ir a "Nuevo Equipo"
2. Completar el formulario con los datos del equipo
3. Guardar - se generará automáticamente un código QR
4. Imprimir el QR y pegarlo en el equipamiento físico

### 2. Registrar Entrega

1. Ir a "Entrega"
2. Ingresar el nombre del responsable
3. Iniciar el escáner de QR
4. Escanear cada equipo que se va a entregar
5. Verificar el checklist
6. Registrar la entrega

### 3. Registrar Recepción

1. Ir a "Recepción"
2. Seleccionar la entrega pendiente
3. Iniciar el escáner de QR
4. Escanear cada equipo recibido
5. El sistema mostrará visualmente qué equipos faltan
6. Agregar observaciones si es necesario
7. Registrar la recepción

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables (futuro)
├── config/
│   └── firebase.ts      # Configuración de Firebase
├── pages/               # Páginas de la aplicación
│   ├── HomePage.tsx
│   ├── EquipmentListPage.tsx
│   ├── EquipmentFormPage.tsx
│   ├── DeliveryPage.tsx
│   └── ReceptionPage.tsx
├── services/            # Servicios de datos
│   ├── equipmentService.ts
│   ├── qrService.ts
│   └── deliveryService.ts
├── types/               # Definiciones de TypeScript
│   └── index.ts
├── App.tsx              # Componente principal
├── main.tsx             # Punto de entrada
└── style.css            # Estilos con Tailwind
```

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Firebase Firestore** - Base de datos NoSQL
- **React Router** - Navegación
- **qrcode** - Generación de códigos QR
- **html5-qrcode** - Escaneo de QR con cámara
- **jsPDF** - Generación de PDFs

## 📝 Notas Importantes

- **Permisos de Cámara**: La aplicación necesita permisos de cámara para escanear códigos QR
- **HTTPS**: El escaneo de QR solo funciona en HTTPS (o localhost)
- **Navegadores Compatibles**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Responsive**: La aplicación funciona en desktop y móviles

## 🐛 Solución de Problemas

### El escáner de QR no funciona

- Verifica que la aplicación esté en HTTPS o localhost
- Asegúrate de dar permisos de cámara al navegador
- Prueba en otro navegador

### Error de Firebase

- Verifica que las credenciales en `firebase.ts` sean correctas
- Asegúrate de haber habilitado Firestore en Firebase Console
- Revisa las reglas de seguridad de Firestore

### Error al hacer build

- Elimina `node_modules` y `package-lock.json`
- Ejecuta `npm install` nuevamente
- Ejecuta `npm run build`

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Desarrollo

Desarrollado con ❤️ usando React + TypeScript + Firebase
