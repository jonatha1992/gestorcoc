import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, TTL } from './cache.service';

const CACHE_KEY = 'personnel_people';

@Injectable({
    providedIn: 'root'
})
export class PersonnelService {
    constructor(private api: ApiService, private cache: CacheService) { }

    getPeople(): Observable<any[]> {
        return this.cache.withCache<any[]>(
            CACHE_KEY,
            TTL.MEDIUM,
            this.api.get<any[]>('api/people/')
        );
    }

    createPerson(person: any): Observable<any> {
        return this.api.post<any>('api/people/', person).pipe(
            tap(() => this.cache.invalidate(CACHE_KEY))
        );
    }

    updatePerson(id: number, person: any): Observable<any> {
        return this.api.put<any>(`api/people/${id}/`, person).pipe(
            tap(() => this.cache.invalidate(CACHE_KEY))
        );
    }

    deletePerson(id: number): Observable<any> {
        return this.api.delete<any>(`api/people/${id}/`).pipe(
            tap(() => this.cache.invalidate(CACHE_KEY))
        );
    }
}
