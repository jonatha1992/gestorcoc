import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Unit } from '../models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class UnitService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private collectionName = 'organization_units';

    getUnits(): Observable<Unit[]> {
        const unitsRef = collection(this.firestore, this.collectionName);
        const q = query(unitsRef, limit(50));
        return collectionData(q, { idField: 'id' }) as Observable<Unit[]>;
    }

    addUnit(unit: Partial<Unit>) {
        const unitsRef = collection(this.firestore, this.collectionName);
        return addDoc(unitsRef, {
            ...unit,
            createdAt: Timestamp.now(),
            createdBy: this.authService.getCurrentUserId()
        });
    }

    updateUnit(unit: Partial<Unit>) {
        const unitDoc = doc(this.firestore, `${this.collectionName}/${unit.id}`);
        const { id, ...data } = unit;
        return updateDoc(unitDoc, data);
    }

    deleteUnit(id: string) {
        const unitDoc = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(unitDoc);
    }
}
