import { Timestamp } from 'firebase/firestore';

export type DocumentType = 'ENTRADA' | 'SALIDA';
export type DocumentStatus = 'PENDIENTE' | 'EN_PROCESO' | 'ARCHIVADO' | 'FINALIZADO';
export type DocumentPriority = 'BAJA' | 'MEDIA' | 'ALTA';

export interface DocumentModel {
    id?: string;
    type: DocumentType;
    date: Timestamp;
    referenceNumber: string; // e.g., NO-2024-12345678-APN-DNE#MRE
    sender: string;
    recipient: string;
    subject: string;
    description?: string;
    status: DocumentStatus;
    priority: DocumentPriority;
    attachments?: string[];
    createdBy?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
