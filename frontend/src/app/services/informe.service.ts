import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VideoReportFormData {
    report_date: string;
    destinatarios: string;
    tipo_informe: string;
    numero_informe: string;
    grado: string;
    operador: string;
    lup: string;
    sistema: string;
    prevencion_sumaria: string;
    caratula: string;
    fiscalia: string;
    fiscal: string;
    denunciante: string;
    vuelo: string;
    objeto_denunciado: string;
    desarrollo: string;
    conclusion: string;
    firma: string;
}

export interface VideoReportFrame {
    id_temp: string;
    file_name: string;
    mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
    content_base64: string;
    description: string;
    order: number;
    preview_url?: string;
    size_bytes?: number;
}

export interface VideoReportPayload {
    report_data: VideoReportFormData;
    frames: VideoReportFrame[];
}

@Injectable({
    providedIn: 'root'
})
export class InformeService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    generateVideoAnalysisReport(payload: VideoReportPayload): Observable<Blob> {
        return this.http.post(`${this.baseUrl}/api/video-analysis-report/`, payload, {
            responseType: 'blob'
        });
    }
}
