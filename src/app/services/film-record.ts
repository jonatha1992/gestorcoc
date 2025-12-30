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
import { Observable, from, map, switchMap, of } from 'rxjs';
import { FilmRecord } from '../models';
import { OrganizationAccessService } from './organization-access.service';

@Injectable({
  providedIn: 'root',
})
export class FilmRecordService {
  private firestore = inject(Firestore);
  private orgAccess = inject(OrganizationAccessService);
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
      const term = filters.nroAsunto.toUpperCase();
      constraints.push(where('nroAsunto', '>=', term));
      constraints.push(where('nroAsunto', '<=', term + '\uf8ff'));
    }
    if (filters.nroSolicitud) {
      const term = filters.nroSolicitud.toUpperCase();
      constraints.push(where('nroSolicitud', '>=', term));
      constraints.push(where('nroSolicitud', '<=', term + '\uf8ff'));
    }
    if (filters.estado) {
      constraints.push(where('estado', '==', filters.estado));
    }
    if (filters.solicitante) {
      const term = filters.solicitante.toUpperCase();
      constraints.push(where('solicitante', '>=', term));
      constraints.push(where('solicitante', '<=', term + '\uf8ff'));
    }

    // New filter: idTipoSolicitud
    if (filters.idTipoSolicitud) {
      constraints.push(where('idTipoSolicitud', '==', filters.idTipoSolicitud));
    }

    // New filter: Date Range (fechaIngreso)
    if (filters.fechaDesde) {
      constraints.push(where('fechaIngreso', '>=', filters.fechaDesde));
    }
    if (filters.fechaHasta) {
      constraints.push(where('fechaIngreso', '<=', filters.fechaHasta));
    }

    // --- FIRESTORE QUERY LIMITATION FIX ---
    // If we have ANY inequality filter, the first orderBy MUST be on that same field.
    // Range filters we have: nroAsunto, nroSolicitud, solicitante, fechaIngreso.

    let firstSortField = sortField;
    let firstSortDir = sortDirection;

    if (filters.nroAsunto) {
      firstSortField = 'nroAsunto';
    } else if (filters.nroSolicitud) {
      firstSortField = 'nroSolicitud';
    } else if (filters.solicitante) {
      firstSortField = 'solicitante';
    } else if (filters.fechaDesde || filters.fechaHasta) {
      firstSortField = 'fechaIngreso';
    }

    // Sort
    constraints.push(orderBy(firstSortField, firstSortDir));

    // If the requested sort field is different from the mandatory one, add it as second sort
    if (firstSortField !== sortField) {
      constraints.push(orderBy(sortField, sortDirection));
    }

    // Pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pageSize));

    const q = query(recordsRef, ...constraints);

    return this.orgAccess.allowedAccess$.pipe(
      switchMap(access => {
        const finalConstraints = [...constraints];

        if (!access.isAdmin) {
          // If not admin, must filter by units OR systems
          if ((!access.units || access.units.length === 0) && (!access.systems || access.systems.length === 0)) {
            return of({ data: [], lastVisible: null });
          }

          if (access.units && access.units.length > 0) {
            // Priority to units filter. Limit 10 due to Firestore 'in'
            finalConstraints.push(where('orgUnitId', 'in', access.units.slice(0, 10)));
          } else if (access.systems && access.systems.length > 0) {
            finalConstraints.push(where('orgSystemId', 'in', access.systems.slice(0, 10)));
          }
        }

        const finalQuery = query(recordsRef, ...finalConstraints);
        return from(getDocs(finalQuery)).pipe(
          map(snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FilmRecord));
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            return { data, lastVisible };
          })
        );
      })
    );
  }

  getAllFilmRecords(): Observable<FilmRecord[]> {
    const recordsRef = collection(this.firestore, this.collectionName);
    return collectionData(query(recordsRef, orderBy('nroOrden', 'desc'), limit(50)), { idField: 'id' }) as Observable<FilmRecord[]>;
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
