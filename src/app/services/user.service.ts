import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, Timestamp, query, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private usersCollection = collection(this.firestore, 'users');

    /**
     * Get all users from Firestore
     */
    getUsers(): Observable<User[]> {
        const q = query(this.usersCollection, orderBy('displayName', 'asc'), limit(50));
        return collectionData(q, { idField: 'uid' }) as Observable<User[]>;
    }

    /**
     * Update user data (roles, status, etc.)
     */
    async updateUser(uid: string, data: Partial<User>): Promise<void> {
        const userDoc = doc(this.firestore, `users/${uid}`);
        await updateDoc(userDoc, {
            ...data,
            updatedAt: Timestamp.now()
        });
    }

    /**
     * Toggle user active status
     */
    async toggleStatus(uid: string, currentStatus: boolean): Promise<void> {
        return this.updateUser(uid, { isActive: !currentStatus });
    }

    /**
     * Update user roles
     */
    async updateRoles(uid: string, roleIds: string[]): Promise<void> {
        return this.updateUser(uid, { roleIds });
    }
}
