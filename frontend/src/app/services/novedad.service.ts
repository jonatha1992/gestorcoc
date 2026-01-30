import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class NovedadService {
    constructor(private api: ApiService) { }

    getNovedades(): Observable<any[]> {
        return this.api.get<any[]>('api/novedades/');
    }

    createNovedad(data: any): Observable<any> {
        return this.api.post<any>('api/novedades/', data);
    }

    deleteNovedad(id: number): Observable<any> {
        return this.api.delete<any>(`api/novedades/${id}/`);
    }

    updateNovedad(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/novedades/${id}/`, data);
    }
}
