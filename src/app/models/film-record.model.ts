import { Timestamp } from '@angular/fire/firestore';

// ============================================
// REGISTROS FÍLMICOS
// ============================================

export type FilmRecordStatus = 'Pendiente' | 'En Proceso' | 'Finalizado';

export interface FilmRecord {
    id?: string;
    title: string;
    orderNumber?: string;
    entryDate?: string;
    requestTypeId?: string;          // Referencia a CatalogItem
    requestNumber?: string;
    requester?: string;
    judicialCase?: string;
    caratula?: string;
    incidentDate?: string;
    crimeTypeId?: string;            // Referencia a CatalogItem
    unitId?: string;                 // Referencia a CatalogItem
    receivedBy?: string;
    madeBy?: string;
    detail?: string;
    dvdNumber?: string;
    reportNumber?: string;
    ifgra?: string;
    fileNumber?: string;
    deliveryAct?: string;
    exitDate?: string;
    withdrawnBy?: string;
    organizationId?: string;         // Referencia a CatalogItem
    status: FilmRecordStatus;
    observations?: string;

    // Auditoría
    createdAt?: Timestamp;
    createdBy?: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}
