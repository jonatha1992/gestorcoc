import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);

    // Signals para estado reactivo
    private currentFirebaseUser = signal<FirebaseUser | null>(null);
    private currentAppUser = signal<User | null>(null);

    // Computed signals públicos
    isAuthenticated = computed(() => this.currentFirebaseUser() !== null);
    user = computed(() => this.currentAppUser());
    userRoles = computed(() => this.currentAppUser()?.roleIds ?? []);

    constructor() {
        // Escuchar cambios de autenticación
        onAuthStateChanged(this.auth, async (firebaseUser) => {
            this.currentFirebaseUser.set(firebaseUser);

            if (firebaseUser) {
                // Cargar datos del usuario desde Firestore
                this.loadUserData(firebaseUser.uid);
            } else {
                this.currentAppUser.set(null);
            }
        });
    }

    private async loadUserData(uid: string) {
        const userDoc = doc(this.firestore, `users/${uid}`);
        docData(userDoc, { idField: 'uid' }).subscribe((user) => {
            this.currentAppUser.set(user as User);
        });
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    async login(email: string, password: string): Promise<void> {
        const credential = await signInWithEmailAndPassword(this.auth, email, password);

        // Actualizar último login
        const userDoc = doc(this.firestore, `users/${credential.user.uid}`);
        await updateDoc(userDoc, {
            lastLoginAt: Timestamp.now()
        });
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
        this.currentAppUser.set(null);
    }

    // ============================================
    // VERIFICACIÓN DE PERMISOS
    // ============================================

    hasRole(roleName: string): boolean {
        return this.userRoles().includes(roleName);
    }

    hasAnyRole(roleNames: string[]): boolean {
        return roleNames.some(role => this.userRoles().includes(role));
    }

    // ============================================
    // GESTIÓN DE USUARIOS
    // ============================================

    getUserById(uid: string): Observable<User> {
        const userDoc = doc(this.firestore, `users/${uid}`);
        return docData(userDoc, { idField: 'uid' }) as Observable<User>;
    }

    async createUserProfile(user: User): Promise<void> {
        const userDoc = doc(this.firestore, `users/${user.uid}`);
        await setDoc(userDoc, {
            ...user,
            createdAt: Timestamp.now(),
            isActive: true
        });
    }

    async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
        const userDoc = doc(this.firestore, `users/${uid}`);
        await updateDoc(userDoc, {
            ...data,
            updatedAt: Timestamp.now()
        });
    }

    // ============================================
    // HELPER: UID del usuario actual
    // ============================================

    getCurrentUserId(): string | null {
        return this.currentFirebaseUser()?.uid ?? null;
    }
}
