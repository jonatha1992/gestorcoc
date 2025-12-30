import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query, limit, orderBy, where } from '@angular/fire/firestore';
import { Observable, switchMap, of } from 'rxjs';
import { Equipment } from '../models';
import { OrganizationAccessService } from './organization-access.service';

@Injectable({
  providedIn: 'root',
})
export class EquipmentService {
  private firestore = inject(Firestore);
  private orgAccess = inject(OrganizationAccessService);

  getEquipment(): Observable<Equipment[]> {
    const equipmentRef = collection(this.firestore, 'equipamiento');

    return this.orgAccess.allowedAccess$.pipe(
      switchMap(access => {
        if (access.isAdmin) {
          return collectionData(query(equipmentRef, orderBy('name', 'asc'), limit(50)), { idField: 'id' }) as Observable<Equipment[]>;
        }

        if (!access.units || access.units.length === 0) {
          return of([]);
        }

        return collectionData(query(equipmentRef, where('orgUnitId', 'in', access.units.slice(0, 10)), orderBy('name', 'asc'), limit(50)), { idField: 'id' }) as Observable<Equipment[]>;
      })
    );
  }

  getEquipmentById(id: string): Observable<Equipment> {
    const equipmentDoc = doc(this.firestore, `equipamiento/${id}`);
    return docData(equipmentDoc, { idField: 'id' }) as Observable<Equipment>;
  }

  addEquipment(equipment: Equipment) {
    const equipmentRef = collection(this.firestore, 'equipamiento');
    return addDoc(equipmentRef, equipment);
  }

  updateEquipment(equipment: Equipment) {
    const equipmentDoc = doc(this.firestore, `equipamiento/${equipment.id}`);
    const { id, ...data } = equipment;
    return updateDoc(equipmentDoc, data);
  }

  deleteEquipment(id: string) {
    const equipmentDoc = doc(this.firestore, `equipamiento/${id}`);
    return deleteDoc(equipmentDoc);
  }
}
