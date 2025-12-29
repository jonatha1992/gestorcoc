import { Timestamp } from '@angular/fire/firestore';

export interface Unit {
    id?: string;
    name: string;
    description?: string;
    createdAt: Timestamp;
    createdBy: string;
}

export interface CctvSystem {
    id?: string;
    unitId: string;
    name: string;
    description?: string;
    brand?: string;
    model?: string;
    ipAddress?: string;
    location?: string;
    createdAt: Timestamp;
    createdBy: string;
}

export interface OrganizationalGroup {
    id?: string;
    name: string;
    description?: string;
    unitIds: string[]; // List of Unit IDs this group has access to
    systemIds: string[]; // Specific System IDs if granular access is needed
    roleId?: string; // Base role for members of this group (admin, operador, consulta)
    createdAt: Timestamp;
    createdBy: string;
}
