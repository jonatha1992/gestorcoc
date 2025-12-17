import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { Equipment, EquipmentFormData } from '../types';
import { generateQRCode } from './qrService';

// Crear nuevo equipamiento
export const createEquipment = async (data: EquipmentFormData): Promise<string> => {
    try {
        // Crear documento sin QR primero
        const docRef = await addDoc(collection(db, COLLECTIONS.EQUIPMENT), {
            ...data,
            fechaAlta: Timestamp.now(),
            qrCode: '', // Temporal
        });

        // Generar QR con el ID del documento
        const qrCode = await generateQRCode(docRef.id);

        // Actualizar con el QR generado
        await updateDoc(doc(db, COLLECTIONS.EQUIPMENT, docRef.id), {
            qrCode,
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating equipment:', error);
        throw error;
    }
};

// Obtener todo el equipamiento
export const getAllEquipment = async (): Promise<Equipment[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.EQUIPMENT));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaAlta: doc.data().fechaAlta.toDate(),
        })) as Equipment[];
    } catch (error) {
        console.error('Error getting equipment:', error);
        throw error;
    }
};

// Obtener equipamiento por ID
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
    try {
        const docRef = doc(db, COLLECTIONS.EQUIPMENT, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                fechaAlta: docSnap.data().fechaAlta.toDate(),
            } as Equipment;
        }
        return null;
    } catch (error) {
        console.error('Error getting equipment by ID:', error);
        throw error;
    }
};

// Obtener equipamiento por código QR
export const getEquipmentByQR = async (qrCode: string): Promise<Equipment | null> => {
    try {
        const q = query(
            collection(db, COLLECTIONS.EQUIPMENT),
            where('qrCode', '==', qrCode)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                fechaAlta: doc.data().fechaAlta.toDate(),
            } as Equipment;
        }
        return null;
    } catch (error) {
        console.error('Error getting equipment by QR:', error);
        throw error;
    }
};

// Actualizar equipamiento
export const updateEquipment = async (id: string, data: Partial<EquipmentFormData>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTIONS.EQUIPMENT, id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error('Error updating equipment:', error);
        throw error;
    }
};

// Eliminar equipamiento
export const deleteEquipment = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.EQUIPMENT, id));
    } catch (error) {
        console.error('Error deleting equipment:', error);
        throw error;
    }
};
