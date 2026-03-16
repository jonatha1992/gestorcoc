import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, TTL } from './cache.service';

export interface Unit {
    id: number;
    name: string;
    code: string;
    airport: string | null;
    parent: number | null;
}

export interface SystemAsset {
    id: number;
    name: string;
    system_type: string;
    is_active: boolean;
    unit?: Unit | null;
    unit_id?: number | null;
    unit_code?: string;
    retention_days?: number;
    vms_version?: string;
    servers?: any[];
    camera_count?: number;
}

export interface SystemFilters {
    search?: string;
    ordering?: string;
    unit?: number | string;
    unit__code?: string;
    system_type?: string;
    is_active?: string;
}

export interface ServerFilters {
    search?: string;
    ordering?: string;
    system?: number | string;
    is_active?: string;
}

export interface CameraFilters {
    search?: string;
    ordering?: string;
    server?: number | string;
    status?: string;
}

export interface CameramanGearFilters {
    search?: string;
    ordering?: string;
    condition?: string;
    is_active?: string;
    assigned_to?: string;
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
            this.api.get<any>('api/units/').pipe(
                map((response) => {
                    const results = response?.results ?? response;
                    return Array.isArray(results) ? results : [];
                })
            )
        );
    }

    getSystems(): Observable<SystemAsset[]>;
    getSystems(filters: SystemFilters): Observable<any>;
    getSystems(filters: SystemFilters = {}): Observable<any> {
        if (this.hasActiveFilters(filters)) {
            return this.api.get<any>(`api/systems/?${this.buildQuery(filters)}`);
        }
        return this.cache.withCache<any[]>(
            KEYS.systems, TTL.MEDIUM,
            this.api.get<SystemAsset[]>('api/systems/')
        );
    }

    createSystem(data: any): Observable<any> {
        return this.api.post<any>('api/systems/', data).pipe(
            tap(() => this.invalidateKeys(KEYS.systems))
        );
    }

    updateSystem(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/systems/${id}/`, data).pipe(
            tap(() => this.invalidateKeys(KEYS.systems))
        );
    }

    deleteSystem(id: number): Observable<any> {
        return this.api.delete<any>(`api/systems/${id}/`).pipe(
            tap(() => this.invalidateKeys(KEYS.systems))
        );
    }

    getCameras(): Observable<any[]>;
    getCameras(filters: CameraFilters): Observable<any>;
    getCameras(filters: CameraFilters = {}): Observable<any> {
        if (this.hasActiveFilters(filters)) {
            return this.api.get<any>(`api/cameras/?${this.buildQuery(filters)}`);
        }
        return this.cache.withCache<any[]>(
            KEYS.cameras, TTL.MEDIUM,
            this.api.get<any[]>('api/cameras/')
        );
    }

    createCamera(data: any): Observable<any> {
        return this.api.post<any>('api/cameras/', data).pipe(
            tap(() => this.invalidateKeys(KEYS.cameras, KEYS.systems))
        );
    }

    updateCamera(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/cameras/${id}/`, data).pipe(
            tap(() => this.invalidateKeys(KEYS.cameras, KEYS.systems))
        );
    }

    deleteCamera(id: number): Observable<any> {
        return this.api.delete<any>(`api/cameras/${id}/`).pipe(
            tap(() => this.invalidateKeys(KEYS.cameras, KEYS.systems))
        );
    }

    getServers(): Observable<any[]>;
    getServers(filters: ServerFilters): Observable<any>;
    getServers(filters: ServerFilters = {}): Observable<any> {
        if (this.hasActiveFilters(filters)) {
            return this.api.get<any>(`api/servers/?${this.buildQuery(filters)}`);
        }
        return this.cache.withCache<any[]>(
            KEYS.servers, TTL.MEDIUM,
            this.api.get<any[]>('api/servers/')
        );
    }

    createServer(data: any): Observable<any> {
        return this.api.post<any>('api/servers/', data).pipe(
            tap(() => this.invalidateKeys(KEYS.servers, KEYS.systems))
        );
    }

    updateServer(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/servers/${id}/`, data).pipe(
            tap(() => this.invalidateKeys(KEYS.servers, KEYS.systems))
        );
    }

    deleteServer(id: number): Observable<any> {
        return this.api.delete<any>(`api/servers/${id}/`).pipe(
            tap(() => this.invalidateKeys(KEYS.servers, KEYS.systems))
        );
    }

    getCameramanGear(): Observable<any[]>;
    getCameramanGear(filters: CameramanGearFilters): Observable<any>;
    getCameramanGear(filters: CameramanGearFilters = {}): Observable<any> {
        if (this.hasActiveFilters(filters)) {
            return this.api.get<any>(`api/cameraman-gear/?${this.buildQuery(filters)}`);
        }
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

    private invalidateKeys(...keys: string[]): void {
        for (const key of new Set(keys)) {
            this.cache.invalidate(key);
        }
    }

    private hasActiveFilters<T extends object>(filters: T): boolean {
        const normalized = filters as Record<string, unknown>;
        return Object.values(normalized).some(
            (value) => value !== undefined && value !== null && value !== ''
        );
    }

    private buildQuery<T extends object>(filters: T): string {
        const normalized = filters as Record<string, unknown>;
        const params: string[] = [];
        for (const [key, value] of Object.entries(normalized)) {
            if (value === undefined || value === null || value === '') continue;
            params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
        return params.join('&');
    }
}
