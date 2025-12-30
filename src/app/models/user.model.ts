import { Timestamp } from '@angular/fire/firestore';

// ============================================
// USUARIOS
// ============================================

export interface User {
    uid: string;                     // Firebase Auth UID
    username: string;               // Nombre de usuario (Unique identifier)
    email?: string;                  // LEGACY/INTERNAL: Only if needed for debugging or migration
    displayName: string;
    photoURL?: string;

    roleIds: string[];               // Referencias a roles
    orgGroupIds?: string[];          // Referencias a grupos organizacionales (Unidades/Sistemas)
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

// Definición de Roles
export const ROLE_NAMES = {
    ADMIN: 'admin',
    TURNO_CREV: 'turno_crev',
    TURNO_COC: 'turno_coc'
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

// Definición de Módulos (Alineados con el Navbar)
// 'hechos' (antes registros), 'camaras', 'equipamiento', 'catalogos'
// 'usuarios' y 'roles' (están bajo Configuración en el navbar, pero son permisos distintos)
export type ModuleName = 'hechos' | 'registros' | 'camaras' | 'equipamiento' | 'catalogos' | 'usuarios' | 'roles';

// Definición de Acciones
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'export';

// Estructura de Permiso
export interface Permission {
    module: ModuleName;
    actions: ActionType[];
}

// Interfaz completa de Rol (para Firestore)
export interface Role {
    id?: string;
    name: string;
    permissions: Permission[];
    isSystem?: boolean;
}

// Fallback Permissions (Updated to use new RoleName values)
export const DEFAULT_ROLES_CONFIG: Role[] = [
    {
        name: ROLE_NAMES.ADMIN,
        isSystem: true,
        permissions: [
            { module: 'equipamiento', actions: ['read', 'create', 'update', 'delete', 'export'] },
            { module: 'hechos', actions: ['read', 'create', 'update', 'delete', 'export'] },
            { module: 'camaras', actions: ['read', 'create', 'update', 'delete', 'export'] },
            { module: 'catalogos', actions: ['read', 'create', 'update', 'delete'] },
            { module: 'usuarios', actions: ['read', 'create', 'update', 'delete'] },
            { module: 'roles', actions: ['read', 'create', 'update', 'delete'] }
        ]
    },
    {
        name: ROLE_NAMES.TURNO_CREV,
        permissions: [
            { module: 'hechos', actions: ['read', 'create', 'update'] },
            { module: 'equipamiento', actions: ['read'] }
        ]
    },
    {
        name: ROLE_NAMES.TURNO_COC,
        permissions: [
            { module: 'camaras', actions: ['read', 'create', 'update'] },
            { module: 'equipamiento', actions: ['read', 'create', 'update'] },
            { module: 'hechos', actions: ['read'] }
        ]
    }
];
