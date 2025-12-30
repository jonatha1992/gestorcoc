import { Timestamp } from '@angular/fire/firestore';

// ============================================
// EQUIPAMIENTO
// ============================================

export type EquipmentStatus = 'Disponible' | 'En Reparación' | 'Entregado' | 'Baja';

export interface Equipment {
    id?: string;
    name: string;
    categoryId: string;              // Referencia a CatalogItem
    locationId?: string;             // Referencia a CatalogItem (ubicación)
    parentEquipmentId?: string;      // Para jerarquía de equipos

    serialNumber?: string;
    brand?: string;
    model?: string;
    status: EquipmentStatus;
    description?: string;
    qrCode?: string;

    // Vinculación Organizacional (Nueva Estructura)
    orgUnitId?: string;              // ID de la Unidad

    // Propiedades de Visualización
    unitName?: string;

    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}
