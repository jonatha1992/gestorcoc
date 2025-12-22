import { Timestamp } from '@angular/fire/firestore';

// ============================================
// USUARIOS
// ============================================

export interface User {
    uid: string;                     // Firebase Auth UID
    email: string;
    displayName: string;
    photoURL?: string;

    roleIds: string[];               // Referencias a roles
    isActive: boolean;

    // Metadata
    createdAt: Timestamp;
    lastLoginAt?: Timestamp;
    updatedAt?: Timestamp;
    updatedBy?: string;
}

// ============================================
// ROLES Y PERMISOS
// ============================================

export type ModuleName =
    | 'equipamiento'
    | 'registros'
    | 'camaras'
    | 'catalogos'
    | 'usuarios'
    | 'roles';

export type ActionType = 'read' | 'create' | 'update' | 'delete';

export interface Permission {
    module: ModuleName;
    actions: ActionType[];
}

export interface Role {
    id?: string;
    name: string;                    // Ej: "Admin", "Operador", "Consulta"
    description?: string;
    permissions: Permission[];
    isActive: boolean;

    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}

// ============================================
// ROLES PREDEFINIDOS
// ============================================

export const ROLE_NAMES = {
    ADMIN: 'admin',
    OPERADOR: 'operador',
    CONSULTA: 'consulta',
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

// ============================================
// PERMISOS POR DEFECTO
// ============================================

export const DEFAULT_PERMISSIONS: Record<RoleName, Permission[]> = {
    admin: [
        { module: 'equipamiento', actions: ['read', 'create', 'update', 'delete'] },
        { module: 'registros', actions: ['read', 'create', 'update', 'delete'] },
        { module: 'camaras', actions: ['read', 'create', 'update', 'delete'] },
        { module: 'catalogos', actions: ['read', 'create', 'update', 'delete'] },
        { module: 'usuarios', actions: ['read', 'create', 'update', 'delete'] },
        { module: 'roles', actions: ['read', 'create', 'update', 'delete'] },
    ],
    operador: [
        { module: 'equipamiento', actions: ['read', 'create', 'update'] },
        { module: 'registros', actions: ['read', 'create', 'update'] },
        { module: 'camaras', actions: ['read', 'create', 'update'] },
        { module: 'catalogos', actions: ['read'] },
        { module: 'usuarios', actions: ['read'] },
        { module: 'roles', actions: ['read'] },
    ],
    consulta: [
        { module: 'equipamiento', actions: ['read'] },
        { module: 'registros', actions: ['read'] },
        { module: 'camaras', actions: ['read'] },
        { module: 'catalogos', actions: ['read'] },
        { module: 'usuarios', actions: [] },
        { module: 'roles', actions: [] },
    ],
};
