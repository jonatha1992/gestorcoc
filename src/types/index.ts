// Tipos de datos del equipamiento
export interface Equipment {
    id: string;
    nombre: string;
    categoria: EquipmentCategory;
    numeroSerie: string;
    marca: string;
    modelo: string;
    estado: EquipmentStatus;
    descripcion?: string;
    fechaAlta: Date;
    qrCode: string;
}

export type EquipmentCategory =
    | 'Cámara'
    | 'Iluminación'
    | 'Audio'
    | 'Accesorios'
    | 'Otro';

export type EquipmentStatus =
    | 'Disponible'
    | 'En uso'
    | 'En mantenimiento'
    | 'Dado de baja';

// Tipos para entregas y recepciones
export interface Delivery {
    id: string;
    fecha: Date;
    responsable: string;
    equipos: string[]; // IDs de equipos
    estado: 'Pendiente' | 'Recibido';
    notas?: string;
}

export interface Reception {
    id: string;
    deliveryId: string;
    fecha: Date;
    equiposRecibidos: string[]; // IDs de equipos
    equiposFaltantes: string[]; // IDs de equipos
    observaciones?: string;
}

// Tipo para el formulario de equipamiento
export interface EquipmentFormData {
    nombre: string;
    categoria: EquipmentCategory;
    numeroSerie: string;
    marca: string;
    modelo: string;
    estado: EquipmentStatus;
    descripcion?: string;
}
