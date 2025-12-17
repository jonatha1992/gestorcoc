# 🔥 Firebase - Configuración Completa

## ✅ Estado: CONFIGURADO

Firebase ha sido configurado exitosamente con las credenciales del proyecto **equipamiento-qr**.

## 📋 Credenciales Configuradas

```
Proyecto: equipamiento-qr
Auth Domain: equipamiento-qr.firebaseapp.com
Project ID: equipamiento-qr
Storage Bucket: equipamiento-qr.firebasestorage.app
```

## 🚀 Próximos Pasos

### 1. Habilitar Firestore en Firebase Console

**IMPORTANTE**: Debes habilitar Firestore Database en Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto **equipamiento-qr**
3. En el menú lateral, ve a **Build** > **Firestore Database**
4. Click en **Create database**
5. Selecciona modo de producción o prueba:
   - **Modo de prueba** (recomendado para desarrollo): Permite lectura/escritura sin autenticación por 30 días
   - **Modo de producción**: Requiere configurar reglas de seguridad

6. Selecciona la ubicación (recomendado: `southamerica-east1` para Argentina)
7. Click en **Enable**

### 2. Configurar Reglas de Firestore (Opcional)

Si elegiste modo de producción, configura las reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura a todas las colecciones (desarrollo)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Nota**: Para producción real, deberías implementar reglas más restrictivas.

### 3. Probar la Aplicación

La aplicación ya está corriendo en `http://localhost:5173`

**Prueba el flujo completo**:

1. ✅ Crear un equipo nuevo
2. ✅ Ver el QR generado
3. ✅ Imprimir el QR en PDF
4. ✅ Escanear el QR con la cámara
5. ✅ Crear una entrega
6. ✅ Crear una recepción

### 4. Verificar Datos en Firestore

Después de crear equipos, verifica en Firebase Console:

1. Ve a **Firestore Database**
2. Deberías ver las colecciones:
   - `equipamiento` - Con los equipos creados
   - `entregas` - Con las entregas registradas
   - `recepciones` - Con las recepciones registradas

## 🌐 Desplegar a Firebase Hosting

Cuando estés listo para desplegar:

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Inicializar hosting
firebase init hosting
# - Selecciona el proyecto: equipamiento-qr
# - Public directory: dist
# - Configure as SPA: Yes
# - Set up automatic builds: No
# - Overwrite index.html: No

# 4. Build y deploy
npm run build
firebase deploy
```

Tu app estará disponible en: `https://equipamiento-qr.web.app`

## 📱 Acceso a Cámara

**Importante**: El escaneo de QR con cámara solo funciona en:

- ✅ HTTPS (producción)
- ✅ localhost (desarrollo)
- ❌ HTTP en otras URLs

Por eso es importante desplegar a Firebase Hosting para probar en móviles.

## 🔒 Seguridad

**Nota de Seguridad**: Las credenciales de Firebase en el código frontend son normales y esperadas. Firebase usa reglas de seguridad en el backend para proteger los datos, no las credenciales del cliente.

## ✅ Checklist Final

- [x] Credenciales de Firebase configuradas
- [ ] Firestore Database habilitado en Firebase Console
- [ ] Reglas de Firestore configuradas
- [ ] Aplicación probada localmente
- [ ] Datos verificados en Firestore Console
- [ ] Desplegado a Firebase Hosting (opcional)

## 🎉 ¡Listo

La configuración de Firebase está completa. Solo falta habilitar Firestore en la consola y ¡ya puedes empezar a usar la aplicación!
