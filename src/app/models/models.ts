export interface Equipment {
    id?: string;
    name: string;
    category: string;
    serialNumber?: string;
    brand?: string;
    model?: string;
    status: 'Disponible' | 'En Reparación' | 'Entregado' | 'Baja';
    description?: string;
    qrCode?: string;
    createdAt: any; // Firestore Timestamp
}

export interface FilmRecord {
    id?: string;
    title: string;
    orderNumber?: string;
    entryDate?: string;
    requestType?: string;
    requestNumber?: string;
    requester?: string;
    judicialCase?: string;
    caratula?: string;
    incidentDate?: string;
    crimeType?: string;
    unit?: string;
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
    organization?: string;
    status: 'Pendiente' | 'En Proceso' | 'Finalizado';
    observations?: string;
}
