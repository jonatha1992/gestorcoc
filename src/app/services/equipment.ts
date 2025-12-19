import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Equipment } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class EquipmentService {
  private firestore = inject(Firestore);
  private equipmentCollection = collection(this.firestore, 'equipamiento');

  getEquipment(): Observable<Equipment[]> {
    return collectionData(this.equipmentCollection, { idField: 'id' }) as Observable<Equipment[]>;
  }

  getEquipmentById(id: string): Observable<Equipment> {
    const equipmentDoc = doc(this.firestore, `equipamiento/${id}`);
    return docData(equipmentDoc, { idField: 'id' }) as Observable<Equipment>;
  }

  addEquipment(equipment: Equipment) {
    return addDoc(this.equipmentCollection, equipment);
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
