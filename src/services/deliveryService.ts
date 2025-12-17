import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { Delivery, Reception } from '../types';

// Crear nueva entrega
export const createDelivery = async (
    responsable: string,
    equipos: string[],
    notas?: string
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.DELIVERIES), {
            fecha: Timestamp.now(),
            responsable,
            equipos,
            estado: 'Pendiente',
            notas: notas || '',
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating delivery:', error);
        throw error;
    }
};

// Obtener todas las entregas
export const getAllDeliveries = async (): Promise<Delivery[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.DELIVERIES));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha.toDate(),
        })) as Delivery[];
    } catch (error) {
        console.error('Error getting deliveries:', error);
        throw error;
    }
};

// Obtener entregas pendientes
export const getPendingDeliveries = async (): Promise<Delivery[]> => {
    try {
        const q = query(
            collection(db, COLLECTIONS.DELIVERIES),
            where('estado', '==', 'Pendiente')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha.toDate(),
        })) as Delivery[];
    } catch (error) {
        console.error('Error getting pending deliveries:', error);
        throw error;
    }
};

// Crear recepción
export const createReception = async (
    deliveryId: string,
    equiposRecibidos: string[],
    equiposFaltantes: string[],
    observaciones?: string
): Promise<string> => {
    try {
        // Crear documento de recepción
        const docRef = await addDoc(collection(db, COLLECTIONS.RECEPTIONS), {
            deliveryId,
            fecha: Timestamp.now(),
            equiposRecibidos,
            equiposFaltantes,
            observaciones: observaciones || '',
        });

        // Actualizar estado de la entrega
        const deliveryRef = doc(db, COLLECTIONS.DELIVERIES, deliveryId);
        await updateDoc(deliveryRef, {
            estado: 'Recibido',
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating reception:', error);
        throw error;
    }
};

// Obtener todas las recepciones
export const getAllReceptions = async (): Promise<Reception[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.RECEPTIONS));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha.toDate(),
        })) as Reception[];
    } catch (error) {
        console.error('Error getting receptions:', error);
        throw error;
    }
};

// Validar recepción (comparar equipos entregados vs recibidos)
export const validateReception = (
    deliveredEquipment: string[],
    receivedEquipment: string[]
): { isValid: boolean; missing: string[] } => {
    const missing = deliveredEquipment.filter(
        id => !receivedEquipment.includes(id)
    );

    return {
        isValid: missing.length === 0,
        missing,
    };
};
