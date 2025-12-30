import { Timestamp } from '@angular/fire/firestore';

export interface Hecho {
    id?: string;
    nroOrden: number;            // Auto-incremental or manual? Assuming manual for now or auto-assigned by service
    fechaIntervencion: Timestamp;

    // Catalog definitions will be strings (referencing Catalog Item names or IDs)
    novedad: string;             // De Catálogo: "Novedades"

    quienDetecta: 'Guardia de Prevención' | 'Centro Monitoreo';

    elementos: string;           // De Catálogo: "Elementos" (General)
    sector: string;

    solucionadoCOC: boolean;     // Se solucionó por intervención del COC (Sí/No)
    generoCausa: boolean;        // Se generó causa (Sí/No)

    hsResolucion: string;        // Hs de resolución (Time/Duration string?)
    detalleCierre: string;       // Detalle cierre de resolución

    sugerencia: string;
    falencia: string;
    observaciones: string;

    // Metadata
    createdAt: Timestamp;
    createdBy: string; // User UID
    updatedAt?: Timestamp;
}
