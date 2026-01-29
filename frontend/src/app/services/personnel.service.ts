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
}
