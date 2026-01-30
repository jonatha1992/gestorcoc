import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AssetService {
    constructor(private api: ApiService) { }

    getSystems(): Observable<any[]> {
        return this.api.get<any[]>('api/systems/');
    }

    getCameras(): Observable<any[]> {
        return this.api.get<any[]>('api/cameras/');
    }

    getServers(): Observable<any[]> {
        return this.api.get<any[]>('api/servers/');
    }

    getCameramanGear(): Observable<any[]> {
        return this.api.get<any[]>('api/cameraman-gear/');
    }

    createCameramanGear(gear: any): Observable<any> {
        return this.api.post<any>('api/cameraman-gear/', gear);
    }

    updateCameramanGear(id: number, gear: any): Observable<any> {
        return this.api.put<any>(`api/cameraman-gear/${id}/`, gear);
    }

    deleteCameramanGear(id: number): Observable<any> {
        return this.api.delete<any>(`api/cameraman-gear/${id}/`);
    }
}
