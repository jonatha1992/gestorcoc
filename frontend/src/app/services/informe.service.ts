import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type VideoReportHashAlgorithm = 'sha1' | 'sha3' | 'sha256' | 'sha512' | 'otro';
// Removed VideoReportExportFormat
export type VideoReportVmsAuthenticityMode =
    | 'vms_propio'
    | 'hash_preventivo'
    | 'sin_autenticacion'
    | 'otro';

export interface VideoReportInvolvedPerson {
    role?: string;
    full_name?: string;
    document_type?: string;
    document_number?: string;
    nationality?: string;
    birth_date?: string;
    age?: number | null;
}

export interface MaterialSpeechContext {
    sistema?: string;
    aeropuerto?: string;
    cantidad_observada?: string;
    sectores_analizados?: string;
    franja_horaria_analizada?: string;
    tiempo_total_analisis?: string;
    sintesis_conclusion?: string;
    prevencion_sumaria?: string;
    caratula?: string;
    fecha_hecho?: string;
    vuelo?: string;
    empresa_aerea?: string;
    destino?: string;
    unidad?: string;
    vms_native_hash_algorithms?: VideoReportHashAlgorithm[];
    vms_native_hash_algorithm_other?: string;
    hash_algorithms?: VideoReportHashAlgorithm[];
    hash_algorithm_other?: string;
    hash_program?: string;
    medida_seguridad_interna?: string;
    vms_authenticity_mode?: VideoReportVmsAuthenticityMode | '';
    vms_authenticity_detail?: string;
    motivo_sin_hash?: string;
    involved_people_summary?: string;
    involved_people?: VideoReportInvolvedPerson[];
}

export interface VideoReportFormData {
    report_date: string;
    destinatarios: string;
    tipo_informe: string;
    numero_informe: string;
    grado: string;
    operador: string;
    lup: string;
    sistema: string;
    cantidad_observada: string;
    sectores_analizados: string;
    franja_horaria_analizada: string;
    tiempo_total_analisis: string;
    sintesis_conclusion: string;
    sintesis_desarrollo: string;
    vms_native_hash_algorithms: VideoReportHashAlgorithm[];
    vms_native_hash_algorithm_other: string;
    hash_algorithms: VideoReportHashAlgorithm[];
    hash_algorithm_other: string;
    hash_program: string;
    medida_seguridad_interna: string;
    vms_authenticity_mode: VideoReportVmsAuthenticityMode | '';
    vms_authenticity_detail: string;
    motivo_sin_hash: string;
    prevencion_sumaria: string;
    caratula: string;
    fiscalia: string;
    fiscal: string;
    denunciante: string;
    involved_people_summary: string;
    involved_people: VideoReportInvolvedPerson[];
    vuelo: string;
    empresa_aerea: string;
    destino: string;
    fecha_hecho: string;
    objeto_denunciado: string;
    unidad: string;
    aeropuerto: string;
    material_filmico: string;
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

export type ImproveVideoTextMode = 'material_filmico' | 'desarrollo' | 'conclusion' | 'full';

export interface ImproveVideoTextPayload {
    material_filmico: string;
    desarrollo: string;
    conclusion: string;
    material_context?: MaterialSpeechContext;
    api_key?: string;
    mode?: ImproveVideoTextMode;
    preferred_provider?: string;
}

export interface ImproveVideoTextResponse {
    material_filmico: string;
    desarrollo: string;
    conclusion: string;
    ai_applied?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class InformeService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    generateVideoAnalysisReport(payload: VideoReportPayload): Observable<HttpResponse<Blob>> {
        return this.http.post(`${this.baseUrl}/api/video-analysis-report/`, payload, {
            responseType: 'blob',
            observe: 'response'
        });
    }

    improveVideoText(payload: ImproveVideoTextPayload): Observable<ImproveVideoTextResponse> {
        return this.http.post<ImproveVideoTextResponse>(`${this.baseUrl}/api/video-analysis-improve-text/`, payload);
    }

    saveReportDraft(filmRecordId: number, formData: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/api/film-records/${filmRecordId}/save_report_draft/`, formData);
    }

    saveReport(data: { film_record?: number | null; numero_informe?: string; report_date?: string; form_data?: any }): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/api/video-analysis-reports/`, data);
    }

    updateReport(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/api/video-analysis-reports/${id}/`, data);
    }

    getReportByRecord(filmRecordId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/api/video-analysis-reports/?film_record=${filmRecordId}`);
    }

    getReport(id: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/api/video-analysis-reports/${id}/`);
    }

    listReports(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/api/video-analysis-reports/`);
    }
}
