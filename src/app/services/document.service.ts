import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, collectionData, where, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { DocumentModel } from '../models/document.model';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private firestore = inject(Firestore);
    private collectionName = 'documents';

    constructor() { }

    getDocuments(): Observable<DocumentModel[]> {
        const colRef = collection(this.firestore, this.collectionName);
        const q = query(colRef, orderBy('date', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<DocumentModel[]>;
    }

    getDocumentsByType(type: 'ENTRADA' | 'SALIDA'): Observable<DocumentModel[]> {
        const colRef = collection(this.firestore, this.collectionName);
        const q = query(colRef, where('type', '==', type), orderBy('date', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<DocumentModel[]>;
    }

    async addDocument(document: DocumentModel): Promise<string> {
        const colRef = collection(this.firestore, this.collectionName);
        // Ensure dates are timestamps
        const docData = {
            ...document,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(colRef, docData);
        return docRef.id;
    }

    async updateDocument(id: string, data: Partial<DocumentModel>): Promise<void> {
        const docRef = doc(this.firestore, this.collectionName, id);
        await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
    }

    async deleteDocument(id: string): Promise<void> {
        const docRef = doc(this.firestore, this.collectionName, id);
        await deleteDoc(docRef);
    }
}
