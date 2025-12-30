import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Hecho } from '../models/hecho.model';

@Injectable({
    providedIn: 'root'
})
export class HechoService {
    private firestore = inject(Firestore);
    private collectionName = 'hechos';

    getHechos(): Observable<Hecho[]> {
        const ref = collection(this.firestore, this.collectionName);
        const q = query(ref, orderBy('fechaIntervencion', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<Hecho[]>;
    }

    async getHecho(id: string): Promise<Hecho | undefined> {
        const ref = doc(this.firestore, `${this.collectionName}/${id}`);
        const snap = await import('@angular/fire/firestore').then(m => m.getDoc(ref));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Hecho : undefined;
    }

    async addHecho(hecho: Omit<Hecho, 'id'>): Promise<string> {
        const ref = collection(this.firestore, this.collectionName);
        const docRef = await addDoc(ref, hecho);
        return docRef.id;
    }

    async updateHecho(id: string, data: Partial<Hecho>): Promise<void> {
        const ref = doc(this.firestore, `${this.collectionName}/${id}`);
        await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
    }

    async deleteHecho(id: string): Promise<void> {
        const ref = doc(this.firestore, `${this.collectionName}/${id}`);
        await deleteDoc(ref);
    }
}
