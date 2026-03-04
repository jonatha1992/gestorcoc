import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
    constructor(private api: ApiService, private http: HttpClient) { }

    getRecords(): Observable<any[]> {
        return this.api.get<any[]>('api/film-records/');
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

    getCatalogs(): Observable<any[]> {
        return this.api.get<any[]>('api/catalogs/');
    }

    generateIntegrityReport(file: File, algorithm: string): Observable<Blob> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('algorithm', algorithm);
        const base = environment.apiUrl;
        return this.http.post(`${base}/api/integrity-check/`, formData, { responseType: 'blob' });
    }

    generateIntegritySummaryReport(entries: any[]): Observable<Blob> {
        const base = environment.apiUrl;
        return this.http.post(`${base}/api/integrity-summary-report/`, { entries }, { responseType: 'blob' });
    }
}
