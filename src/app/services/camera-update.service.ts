import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CameraUpdate } from '../models';

@Injectable({
    providedIn: 'root',
})
export class CameraUpdateService {
    private firestore = inject(Firestore);

    getUpdatesByCameraId(cameraId: string): Observable<CameraUpdate[]> {
        const updatesRef = collection(this.firestore, 'camara_novedades');
        const q = query(
            updatesRef,
            where('cameraId', '==', cameraId),
            orderBy('date', 'desc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<CameraUpdate[]>;
    }

    getOpenUpdates(): Observable<CameraUpdate[]> {
        const updatesRef = collection(this.firestore, 'camara_novedades');
        const q = query(
            updatesRef,
            where('status', '==', 'Abierta'),
            orderBy('date', 'desc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<CameraUpdate[]>;
    }

    getUpdateById(id: string): Observable<CameraUpdate> {
        const updateDoc = doc(this.firestore, `camara_novedades/${id}`);
        return docData(updateDoc, { idField: 'id' }) as Observable<CameraUpdate>;
    }

    addUpdate(update: CameraUpdate) {
        const updatesRef = collection(this.firestore, 'camara_novedades');
        return addDoc(updatesRef, update);
    }

    updateUpdate(update: CameraUpdate) {
        const updateDocRef = doc(this.firestore, `camara_novedades/${update.id}`);
        const { id, ...data } = update;
        return updateDoc(updateDocRef, data);
    }

    deleteUpdate(id: string) {
        const updateDocRef = doc(this.firestore, `camara_novedades/${id}`);
        return deleteDoc(updateDocRef);
    }

    async closeUpdate(id: string, resolvedBy: string, resolutionNotes?: string) {
        const updateDocRef = doc(this.firestore, `camara_novedades/${id}`);
        return updateDoc(updateDocRef, {
            status: 'Cerrada',
            resolvedAt: new Date().toISOString(),
            resolvedBy,
            resolutionNotes
        });
    }
}
