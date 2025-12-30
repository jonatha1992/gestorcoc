import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { OrganizationalGroup } from '../models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class GroupService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private collectionName = 'organization_groups';

    getGroups(): Observable<OrganizationalGroup[]> {
        const groupsRef = collection(this.firestore, this.collectionName);
        const q = query(groupsRef, orderBy('name', 'asc'), limit(50));
        return collectionData(q, { idField: 'id' }) as Observable<OrganizationalGroup[]>;
    }

    addGroup(group: Partial<OrganizationalGroup>) {
        const groupsRef = collection(this.firestore, this.collectionName);
        return addDoc(groupsRef, {
            ...group,
            createdAt: Timestamp.now(),
            createdBy: this.authService.getCurrentUserId()
        });
    }

    updateGroup(group: Partial<OrganizationalGroup>) {
        const groupDoc = doc(this.firestore, `${this.collectionName}/${group.id}`);
        const { id, ...data } = group;
        return updateDoc(groupDoc, data);
    }

    deleteGroup(id: string) {
        const groupDoc = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(groupDoc);
    }
}
