import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecordFilters {
    search?: string;
    delivery_status?: string;
    is_integrity_verified?: string;
    has_backup?: string;
    camera?: number | string;
    operator?: number | string;
    received_by?: number | string;
    verified_by_crev?: number | string;
    entry_date__gte?: string;
    entry_date__lte?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
    constructor(private api: ApiService, private http: HttpClient) { }

    getRecords(page = 1, filters: RecordFilters = {}): Observable<any> {
        const params: string[] = [`page=${page}`];
        if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
        if (filters.delivery_status) params.push(`delivery_status=${filters.delivery_status}`);
        if (filters.is_integrity_verified !== undefined && filters.is_integrity_verified !== '') {
            params.push(`is_integrity_verified=${filters.is_integrity_verified}`);
        }
        if (filters.has_backup !== undefined && filters.has_backup !== '') {
            params.push(`has_backup=${filters.has_backup}`);
        }
        if (filters.camera !== undefined && filters.camera !== null && filters.camera !== '') {
            params.push(`camera=${encodeURIComponent(String(filters.camera))}`);
        }
        if (filters.operator !== undefined && filters.operator !== null && filters.operator !== '') {
            params.push(`operator=${encodeURIComponent(String(filters.operator))}`);
        }
        if (filters.received_by !== undefined && filters.received_by !== null && filters.received_by !== '') {
            params.push(`received_by=${encodeURIComponent(String(filters.received_by))}`);
        }
        if (filters.verified_by_crev !== undefined && filters.verified_by_crev !== null && filters.verified_by_crev !== '') {
            params.push(`verified_by_crev=${encodeURIComponent(String(filters.verified_by_crev))}`);
        }
        if (filters.entry_date__gte) params.push(`entry_date__gte=${encodeURIComponent(filters.entry_date__gte)}`);
        if (filters.entry_date__lte) params.push(`entry_date__lte=${encodeURIComponent(filters.entry_date__lte)}`);
        return this.api.get<any>(`api/film-records/?${params.join('&')}`);
    }

    createRecord(record: any): Observable<any> {
        return this.api.post<any>('api/film-records/', record);
    }

    updateRecord(id: number, record: any): Observable<any> {
        return this.api.patch<any>(`api/film-records/${id}/`, record);
    }

    deleteRecord(id: number): Observable<any> {
        return this.api.delete<any>(`api/film-records/${id}/`);
    }

    verifyByCrev(id: number, observations = ''): Observable<any> {
        return this.api.post<any>(`api/film-records/${id}/verify_by_crev/`, { observations });
    }

    getCatalogs(): Observable<any[]> {
        return this.api.get<any[]>('api/catalogs/');
    }

    generateIntegritySummaryReport(entries: any[]): Observable<Blob> {
        const base = environment.apiUrl;
        return this.http.post(`${base}/api/integrity-summary-report/`, { entries }, { responseType: 'blob' });
    }
}
