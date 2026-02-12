import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PersonnelService {
    constructor(private api: ApiService) { }

    getPeople(): Observable<any[]> {
        return this.api.get<any[]>('api/people/');
    }
<<<<<<< HEAD
=======

    createPerson(person: any): Observable<any> {
        return this.api.post<any>('api/people/', person);
    }

    updatePerson(id: number, person: any): Observable<any> {
        return this.api.put<any>(`api/people/${id}/`, person);
    }

    deletePerson(id: number): Observable<any> {
        return this.api.delete<any>(`api/people/${id}/`);
    }
>>>>>>> dev
}
