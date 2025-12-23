import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query, limit, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Equipment } from '../models';

@Injectable({
  providedIn: 'root',
})
export class EquipmentService {
  private firestore = inject(Firestore);

  getEquipment(): Observable<Equipment[]> {
    const equipmentRef = collection(this.firestore, 'equipamiento');
    return collectionData(query(equipmentRef, orderBy('name', 'asc'), limit(50)), { idField: 'id' }) as Observable<Equipment[]>;
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
