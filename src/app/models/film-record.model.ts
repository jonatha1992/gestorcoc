import { Timestamp } from '@angular/fire/firestore';

// ============================================
// REGISTROS FÍLMICOS
// ============================================

export type FilmRecordStatus = 'Pendiente' | 'En Proceso' | 'Finalizado';

export interface FilmRecord {
    id?: string;
    nroAsunto: string;               // Anteriormente title/numero_asunto
    nroOrden?: string;
    fechaIngreso?: string;
    idTipoSolicitud?: string;        // Referencia a CatalogItem
    nroSolicitud?: string;
    solicitante?: string;
    causaJudicial?: string;
    caratula?: string;
    fechaHecho?: string;
    idTipoDelito?: string;           // Referencia a CatalogItem
    idUnidad?: string;               // Referencia a CatalogItem
    recepcionadoPor?: string;
    confeccionadoPor?: string;
    detalle?: string;
    nroDvd?: string;
    nroInforme?: string;
    ifgra?: string;
    nroExpediente?: string;
    actaEntrega?: string;
    fechaSalida?: string;
    retiradoPor?: string;
    idOrganismo?: string;            // Referencia a CatalogItem
    estado: FilmRecordStatus;
    observaciones?: string;

    // Auditoría
    createdAt?: Timestamp;
    createdBy?: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}
