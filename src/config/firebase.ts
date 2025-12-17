import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for equipamiento-qr project
const firebaseConfig = {
    apiKey: "AIzaSyClu_TGVmkGWG_vaztjIf3SLQcUw-EaLAg",
    authDomain: "equipamiento-qr.firebaseapp.com",
    projectId: "equipamiento-qr",
    storageBucket: "equipamiento-qr.firebasestorage.app",
    messagingSenderId: "582469579718",
    appId: "1:582469579718:web:03a297e1d9ea7e3ae9b8c7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Nombres de las colecciones
export const COLLECTIONS = {
    EQUIPMENT: 'equipamiento',
    DELIVERIES: 'entregas',
    RECEPTIONS: 'recepciones',
};
