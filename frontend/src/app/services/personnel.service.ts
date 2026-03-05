import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, TTL } from './cache.service';

const CACHE_KEY = 'personnel_people';

export interface PeopleFilters {
    search?: string;
    role?: string;
    is_active?: string;
    unit?: string;
    guard_group?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PersonnelService {
    constructor(private api: ApiService, private cache: CacheService) { }

    getPeople(): Observable<any[]>;
    getPeople(page: number, filters: PeopleFilters): Observable<any>;
    getPeople(page?: number, filters: PeopleFilters = {}): Observable<any> {
        if (page === undefined) {
            return this.getPeopleCached();
        }

        const params: string[] = [`page=${page}`];
        if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
        if (filters.role) params.push(`role=${filters.role}`);
        if (filters.is_active !== undefined && filters.is_active !== '') params.push(`is_active=${filters.is_active}`);
        if (filters.unit) params.push(`unit__code=${encodeURIComponent(filters.unit)}`);
        if (filters.guard_group) params.push(`guard_group=${encodeURIComponent(filters.guard_group)}`);
        return this.api.get<any>(`api/people/?${params.join('&')}`);
    }

    private getPeopleCached(): Observable<any[]> {
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
