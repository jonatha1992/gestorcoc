import { Timestamp } from '@angular/fire/firestore';

// ============================================
// CÁMARAS
// ============================================

export type CameraStatus = 'Operativa' | 'Con Falla' | 'Fuera de Servicio' | 'Mantenimiento';

export interface Camera {
    id?: string;
    name: string;
    locationId: string;              // Referencia a CatalogItem (ubicación)
    typeId?: string;                 // Referencia a CatalogItem (tipo de cámara)
    status: CameraStatus;

    ipAddress?: string;
    serialNumber?: string;
    brand?: string;
    model?: string;
    installationDate?: string;
    notes?: string;

    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}

// ============================================
// NOVEDADES DE CÁMARAS
// ============================================

export type CameraUpdateType = 'Falla' | 'Reparación' | 'Mantenimiento' | 'Observación';
export type CameraUpdateStatus = 'Abierta' | 'Cerrada';

export interface CameraUpdate {
    id?: string;
    cameraId: string;                // Referencia a Camera
    type: CameraUpdateType;
    description: string;
    date: string;
    reportedBy: string;

    // Resolución
    resolvedAt?: string;
    resolvedBy?: string;
    resolutionNotes?: string;
    status: CameraUpdateStatus;

    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}
