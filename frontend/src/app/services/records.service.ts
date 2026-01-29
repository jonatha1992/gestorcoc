import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
    constructor(private api: ApiService) { }

    getRecords(): Observable<any[]> {
        return this.api.get<any[]>('api/film-records/');
    }

    createRecord(record: any): Observable<any> {
        return this.api.post<any>('api/film-records/', record);
    }

    getCatalogs(): Observable<any[]> {
        return this.api.get<any[]>('api/catalogs/');
    }
}
