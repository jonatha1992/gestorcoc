import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, getAuth } from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { environment } from '../../environments/environment'; // Assuming environment exists, otherwise we need to use getApp().options matches
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User, ModuleName, ActionType, DEFAULT_ROLES_CONFIG, RoleName } from '../models/user.model';

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

    // --- Auth Actions ---

    // Helper to normalize username to email
    private normalizeEmail(input: string): string {
        if (input.includes('@')) {
            return input; // Already an email
        }
        return `${input.toLowerCase().trim()}@crev.local`; // Append dummy domain
    }

    async login(emailOrUser: string, password: string): Promise<void> {
        try {
            const email = this.normalizeEmail(emailOrUser);
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);

            // Explicitly fetch user profile and claims upon login to ensure state is fresh
            // We can just wait for authState to stream, but explicitly fetching profile ensures 
            // the promise doesn't resolve until we fully 'know' the user info if needed.
            // For now, let the reactive stream handle it.
            return;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
        // return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
        //   map(() => {}), // Return void
        //   catchError(err => {
        //     console.error('Login error:', err);
        //     throw err;
        //   })
        // );
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
        this.currentAppUser.set(null);
    }

    /**
     * Creates a new user without logging out the current admin.
     * Uses a temporary secondary Firebase App instance.
     */
    async createUserByAdmin(usernameOrEmail: string, password: string, displayName: string, roleIds: string[] = []): Promise<void> {
        // 1. Obtener la config de la app actual para replicarla
        const currentApp = getApp();
        const config = currentApp.options;

        // 2. Inicializar una app secundaria ('tempApp')
        const tempAppName = 'tempApp-' + Date.now();
        const tempApp = initializeApp(config, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            // 3. Crear usuario en la app secundaria
            const email = this.normalizeEmail(usernameOrEmail);
            const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUser = credential.user;

            // 4. Crear el perfil en Firestore
            const userProfile: User = {
                uid: newUser.uid,
                // email: email, // REMOVED: User request to not store email
                username: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail,
                displayName: displayName,
                roleIds: roleIds,
                isActive: true,
                createdAt: Timestamp.now(),
                photoURL: ''
            };

            await this.createUserProfile(userProfile);
            await signOut(tempAuth);

        } catch (error: any) {
            console.error('Error creating user:', error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('El usuario/email ya está registrado.');
            }
            throw error;
        } finally {
            await deleteApp(tempApp);
        }
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

    /**
     * Checks if the user has a specific permission for a module
     */
    hasPermission(module: ModuleName, action: ActionType): boolean {
        const roles = this.userRoles() as RoleName[];
        if (roles.includes('admin')) return true;

        return roles.some(roleName => {
            // TODO: In the future, this should fetch from the 'roles' collection in Firestore (RoleService)
            // For now, we use the fallback config if roles are not loaded or for bootstrap.
            // Ideally, AuthService should subscribe to RoleService or have roles loaded in the User model fully.
            // Check matching role in default config:
            const roleConfig = DEFAULT_ROLES_CONFIG.find(r => r.name === roleName);
            if (!roleConfig) return false;

            const modulePerm = roleConfig.permissions.find(p => p.module === module);
            return modulePerm?.actions.includes(action) || false;
        });
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
