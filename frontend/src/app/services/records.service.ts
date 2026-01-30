import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

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

    getCatalogs(): Observable<any[]> {
        return this.api.get<any[]>('api/catalogs/');
    }

    generateIntegrityReport(file: File, algorithm: string): Observable<Blob> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('algorithm', algorithm);

        return this.http.post('http://localhost:8000/api/integrity-check/', formData, {
            responseType: 'blob'
        });
    }
}
