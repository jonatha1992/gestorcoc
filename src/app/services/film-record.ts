import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FilmRecord } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class FilmRecordService {
  private firestore = inject(Firestore);
  private filmRecordsCollection = collection(this.firestore, 'registros_filmicos');

  getFilmRecords(): Observable<FilmRecord[]> {
    return collectionData(this.filmRecordsCollection, { idField: 'id' }) as Observable<FilmRecord[]>;
  }

  getFilmRecordById(id: string): Observable<FilmRecord> {
    const recordDoc = doc(this.firestore, `registros_filmicos/${id}`);
    return docData(recordDoc, { idField: 'id' }) as Observable<FilmRecord>;
  }

  addFilmRecord(record: FilmRecord) {
    return addDoc(this.filmRecordsCollection, record);
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
