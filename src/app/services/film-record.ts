import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  docData,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { FilmRecord } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FilmRecordService {
  private firestore = inject(Firestore);
  private collectionName = 'registros_filmicos';

  getFilmRecords(
    pageSize: number = 20,
    lastDoc: any = null,
    filters: any = {},
    sortField: string = 'nroOrden',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<{ data: FilmRecord[], lastVisible: any }> {
    const recordsRef = collection(this.firestore, this.collectionName);
    const constraints: QueryConstraint[] = [];

    // Filters
    if (filters.nroAsunto) {
      constraints.push(where('nroAsunto', '>=', filters.nroAsunto));
      constraints.push(where('nroAsunto', '<=', filters.nroAsunto + '\uf8ff'));
    }
    if (filters.estado) {
      constraints.push(where('estado', '==', filters.estado));
    }
    if (filters.solicitante) {
      constraints.push(where('solicitante', '>=', filters.solicitante));
      constraints.push(where('solicitante', '<=', filters.solicitante + '\uf8ff'));
    }

    // Sort
    constraints.push(orderBy(sortField, sortDirection));

    // Pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pageSize));

    const q = query(recordsRef, ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FilmRecord));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        return { data, lastVisible };
      })
    );
  }

  getAllFilmRecords(): Observable<FilmRecord[]> {
    const recordsRef = collection(this.firestore, this.collectionName);
    return collectionData(query(recordsRef, orderBy('nroOrden', 'desc')), { idField: 'id' }) as Observable<FilmRecord[]>;
  }

  getFilmRecordById(id: string): Observable<FilmRecord> {
    const recordDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(recordDoc, { idField: 'id' }) as Observable<FilmRecord>;
  }

  addFilmRecord(record: FilmRecord) {
    const recordsRef = collection(this.firestore, this.collectionName);
    return addDoc(recordsRef, record);
  }

  updateFilmRecord(record: FilmRecord) {
    const recordDoc = doc(this.firestore, `${this.collectionName}/${record.id}`);
    const { id, ...data } = record;
    return updateDoc(recordDoc, data);
  }

  deleteFilmRecord(id: string) {
    const recordDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return deleteDoc(recordDoc);
  }
}
