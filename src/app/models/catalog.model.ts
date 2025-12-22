import { Timestamp } from '@angular/fire/firestore';

// ============================================
// CATÁLOGOS (Maestros)
// ============================================

/**
 * Catálogo padre que agrupa ítems relacionados
 * Ejemplos: "Categorías", "Ubicaciones", "Tipos de Cámara", "Tipos de Solicitud"
 */
export interface Catalog {
    id?: string;
    name: string;
    code: string;                    // Código único (ej: 'CATEGORIAS', 'UBICACIONES')
    description?: string;
    isActive: boolean;

    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}

/**
 * Ítem individual de un catálogo
 * Soporta jerarquía mediante parentId
 */
export interface CatalogItem {
    id?: string;
    catalogId: string;               // Referencia al catálogo padre
    parentId?: string;               // Para ítems jerárquicos (ej: ubicaciones anidadas)

    name: string;
    code?: string;                   // Código opcional (ej: 'UB-001')
    description?: string;
    order: number;                   // Orden de visualización
    isActive: boolean;

    // Auditoría
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}

// ============================================
// CATÁLOGOS PREDEFINIDOS (códigos)
// ============================================

export const CATALOG_CODES = {
    CATEGORIAS: 'CATEGORIAS',
    UBICACIONES: 'UBICACIONES',
    ESTADOS_EQUIPO: 'ESTADOS_EQUIPO',
    TIPOS_CAMARA: 'TIPOS_CAMARA',
    TIPOS_SOLICITUD: 'TIPOS_SOLICITUD',
    TIPOS_DELITO: 'TIPOS_DELITO',
    UNIDADES: 'UNIDADES',
    ORGANISMOS: 'ORGANISMOS',
} as const;

export type CatalogCode = typeof CATALOG_CODES[keyof typeof CATALOG_CODES];
