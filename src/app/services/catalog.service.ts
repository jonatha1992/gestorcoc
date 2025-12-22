import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, docData, query, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Catalog, CatalogItem } from '../models';

@Injectable({
    providedIn: 'root',
})
export class CatalogService {
    private firestore = inject(Firestore);

    // ============================================
    // CATÁLOGOS
    // ============================================

    getCatalogs(): Observable<Catalog[]> {
        const catalogsRef = collection(this.firestore, 'catalogs');
        // Envolvemos en query() para evitar error de compatibilidad de tipos
        return collectionData(query(catalogsRef), { idField: 'id' }) as Observable<Catalog[]>;
    }

    getCatalogById(id: string): Observable<Catalog> {
        const catalogDoc = doc(this.firestore, `catalogs/${id}`);
        return docData(catalogDoc, { idField: 'id' }) as Observable<Catalog>;
    }

    getCatalogByCode(code: string): Observable<Catalog | undefined> {
        const catalogsRef = collection(this.firestore, 'catalogs');
        const q = query(catalogsRef, where('code', '==', code));
        return (collectionData(q, { idField: 'id' }) as Observable<Catalog[]>).pipe(
            map(catalogs => catalogs[0]),
            catchError(() => of(undefined))
        );
    }

    addCatalog(catalog: Catalog) {
        const catalogsRef = collection(this.firestore, 'catalogs');
        return addDoc(catalogsRef, catalog);
    }

    updateCatalog(catalog: Catalog) {
        const catalogDoc = doc(this.firestore, `catalogs/${catalog.id}`);
        const { id, ...data } = catalog;
        return updateDoc(catalogDoc, data);
    }

    deleteCatalog(id: string) {
        const catalogDoc = doc(this.firestore, `catalogs/${id}`);
        return deleteDoc(catalogDoc);
    }

    // ============================================
    // ÍTEMS DE CATÁLOGO
    // ============================================

    getItemsByCatalogId(catalogId: string): Observable<CatalogItem[]> {
        const itemsRef = collection(this.firestore, 'catalog_items');
        const q = query(itemsRef, where('catalogId', '==', catalogId));
        return (collectionData(q, { idField: 'id' }) as Observable<CatalogItem[]>).pipe(
            catchError(() => of([]))
        );
    }

    /**
     * Obtiene items de catálogo por código de catálogo.
     * Si no existe el catálogo, retorna array vacío.
     */
    getItemsByCatalogCode(catalogCode: string): Observable<CatalogItem[]> {
        return this.getCatalogByCode(catalogCode).pipe(
            switchMap(catalog => {
                if (!catalog?.id) {
                    return of([]); // Catálogo no existe
                }
                return this.getItemsByCatalogId(catalog.id);
            }),
            catchError(() => of([]))
        );
    }

    getAllItems(): Observable<CatalogItem[]> {
        const itemsRef = collection(this.firestore, 'catalog_items');
        return collectionData(query(itemsRef), { idField: 'id' }) as Observable<CatalogItem[]>;
    }

    getItemById(id: string): Observable<CatalogItem> {
        const itemDoc = doc(this.firestore, `catalog_items/${id}`);
        return docData(itemDoc, { idField: 'id' }) as Observable<CatalogItem>;
    }

    addItem(item: CatalogItem) {
        const itemsRef = collection(this.firestore, 'catalog_items');
        return addDoc(itemsRef, item);
    }

    updateItem(item: CatalogItem) {
        const itemDoc = doc(this.firestore, `catalog_items/${item.id}`);
        const { id, ...data } = item;
        return updateDoc(itemDoc, data);
    }

    deleteItem(id: string) {
        const itemDoc = doc(this.firestore, `catalog_items/${id}`);
        return deleteDoc(itemDoc);
    }
}
