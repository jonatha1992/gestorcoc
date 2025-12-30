import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Role } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class RoleService {
    private firestore = inject(Firestore);
    // Optional: inject AuthService to record who created/updated if needed, but circular dependency risk if AuthService depends on RoleService. 
    // Usually AuthService handles current user state. We can pass user info as args or use a simpler helper.
    // For now, let's keep it simple.

    private collectionName = 'roles';

    getRoles(): Observable<Role[]> {
        const rolesRef = collection(this.firestore, this.collectionName);
        const q = query(rolesRef, orderBy('name', 'asc'), limit(50));
        return collectionData(q, { idField: 'id' }) as Observable<Role[]>;
    }

    addRole(role: Partial<Role>) {
        const rolesRef = collection(this.firestore, this.collectionName);
        return addDoc(rolesRef, {
            ...role,
            createdAt: Timestamp.now(),
            // createdBy: ... (pass from component or simple auth check)
        });
    }

    updateRole(id: string, role: Partial<Role>) {
        const roleDoc = doc(this.firestore, `${this.collectionName}/${id}`);
        return updateDoc(roleDoc, {
            ...role,
            updatedAt: Timestamp.now()
        });
    }

    deleteRole(id: string) {
        const roleDoc = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(roleDoc);
    }
}
