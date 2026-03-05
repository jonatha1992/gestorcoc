import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, TTL } from './cache.service';

export interface Unit {
    id: number;
    name: string;
    code: string;
    airport: string | null;
    parent: number | null;
}

const KEYS = {
    units: 'asset_units',
    systems: 'asset_systems',
    cameras: 'asset_cameras',
    servers: 'asset_servers',
    gear: 'asset_gear',
};

@Injectable({
    providedIn: 'root'
})
export class AssetService {
    constructor(private api: ApiService, private cache: CacheService) { }

    getUnits(): Observable<Unit[]> {
        return this.cache.withCache<Unit[]>(
            KEYS.units, TTL.LONG,
            this.api.get<Unit[]>('api/units/')
        );
    }

    getSystems(): Observable<any[]> {
        return this.cache.withCache<any[]>(
            KEYS.systems, TTL.MEDIUM,
            this.api.get<any[]>('api/systems/')
        );
    }

    createSystem(data: any): Observable<any> {
        return this.api.post<any>('api/systems/', data).pipe(
            tap(() => this.cache.invalidate(KEYS.systems))
        );
    }

    updateSystem(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/systems/${id}/`, data).pipe(
            tap(() => this.cache.invalidate(KEYS.systems))
        );
    }

    deleteSystem(id: number): Observable<any> {
        return this.api.delete<any>(`api/systems/${id}/`).pipe(
            tap(() => this.cache.invalidate(KEYS.systems))
        );
    }

    getCameras(): Observable<any[]> {
        return this.cache.withCache<any[]>(
            KEYS.cameras, TTL.MEDIUM,
            this.api.get<any[]>('api/cameras/')
        );
    }

    createCamera(data: any): Observable<any> {
        return this.api.post<any>('api/cameras/', data).pipe(
            tap(() => this.cache.invalidate(KEYS.cameras))
        );
    }

    updateCamera(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/cameras/${id}/`, data).pipe(
            tap(() => this.cache.invalidate(KEYS.cameras))
        );
    }

    deleteCamera(id: number): Observable<any> {
        return this.api.delete<any>(`api/cameras/${id}/`).pipe(
            tap(() => this.cache.invalidate(KEYS.cameras))
        );
    }

    getServers(): Observable<any[]> {
        return this.cache.withCache<any[]>(
            KEYS.servers, TTL.MEDIUM,
            this.api.get<any[]>('api/servers/')
        );
    }

    createServer(data: any): Observable<any> {
        return this.api.post<any>('api/servers/', data).pipe(
            tap(() => this.cache.invalidate(KEYS.servers))
        );
    }

    updateServer(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/servers/${id}/`, data).pipe(
            tap(() => this.cache.invalidate(KEYS.servers))
        );
    }

    deleteServer(id: number): Observable<any> {
        return this.api.delete<any>(`api/servers/${id}/`).pipe(
            tap(() => this.cache.invalidate(KEYS.servers))
        );
    }

    getCameramanGear(): Observable<any[]> {
        return this.cache.withCache<any[]>(
            KEYS.gear, TTL.MEDIUM,
            this.api.get<any[]>('api/cameraman-gear/')
        );
    }

    createCameramanGear(gear: any): Observable<any> {
        return this.api.post<any>('api/cameraman-gear/', gear).pipe(
            tap(() => this.cache.invalidate(KEYS.gear))
        );
    }

    updateCameramanGear(id: number, gear: any): Observable<any> {
        return this.api.put<any>(`api/cameraman-gear/${id}/`, gear).pipe(
            tap(() => this.cache.invalidate(KEYS.gear))
        );
    }

    deleteCameramanGear(id: number): Observable<any> {
        return this.api.delete<any>(`api/cameraman-gear/${id}/`).pipe(
            tap(() => this.cache.invalidate(KEYS.gear))
        );
    }
}
