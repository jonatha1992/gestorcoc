import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CctvSystem } from '../models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class CctvSystemService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private collectionName = 'organization_systems';

    getSystems(): Observable<CctvSystem[]> {
        const systemsRef = collection(this.firestore, this.collectionName);
        const q = query(systemsRef, limit(50));
        return collectionData(q, { idField: 'id' }) as Observable<CctvSystem[]>;
    }

    getSystemsByUnit(unitId: string): Observable<CctvSystem[]> {
        const systemsRef = collection(this.firestore, this.collectionName);
        const q = query(
            systemsRef,
            where('unitId', '==', unitId),
            limit(50)
        );
        return collectionData(q, { idField: 'id' }) as Observable<CctvSystem[]>;
    }

    addSystem(system: Partial<CctvSystem>) {
        const systemsRef = collection(this.firestore, this.collectionName);
        return addDoc(systemsRef, {
            ...system,
            createdAt: Timestamp.now(),
            createdBy: this.authService.getCurrentUserId()
        });
    }

    updateSystem(system: Partial<CctvSystem>) {
        const systemDoc = doc(this.firestore, `${this.collectionName}/${system.id}`);
        const { id, ...data } = system;
        return updateDoc(systemDoc, data);
    }

    deleteSystem(id: string) {
        const systemDoc = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(systemDoc);
    }
}
