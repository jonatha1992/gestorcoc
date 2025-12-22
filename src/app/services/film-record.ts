import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FilmRecord } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FilmRecordService {
  private firestore = inject(Firestore);

  getFilmRecords(): Observable<FilmRecord[]> {
    const recordsRef = collection(this.firestore, 'registros_filmicos');
    return collectionData(query(recordsRef), { idField: 'id' }) as Observable<FilmRecord[]>;
  }

  getFilmRecordById(id: string): Observable<FilmRecord> {
    const recordDoc = doc(this.firestore, `registros_filmicos/${id}`);
    return docData(recordDoc, { idField: 'id' }) as Observable<FilmRecord>;
  }

  addFilmRecord(record: FilmRecord) {
    const recordsRef = collection(this.firestore, 'registros_filmicos');
    return addDoc(recordsRef, record);
  }

  updateFilmRecord(record: FilmRecord) {
    const recordDoc = doc(this.firestore, `registros_filmicos/${record.id}`);
    const { id, ...data } = record;
    return updateDoc(recordDoc, data);
  }

  deleteFilmRecord(id: string) {
    const recordDoc = doc(this.firestore, `registros_filmicos/${id}`);
    return deleteDoc(recordDoc);
  }
}
