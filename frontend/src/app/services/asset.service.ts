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

    createSystem(data: any): Observable<any> {
        return this.api.post<any>('api/systems/', data);
    }

    updateSystem(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/systems/${id}/`, data);
    }

    deleteSystem(id: number): Observable<any> {
        return this.api.delete<any>(`api/systems/${id}/`);
    }

    getCameras(): Observable<any[]> {
        return this.api.get<any[]>('api/cameras/');
    }

    createCamera(data: any): Observable<any> {
        return this.api.post<any>('api/cameras/', data);
    }

    updateCamera(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/cameras/${id}/`, data);
    }

    deleteCamera(id: number): Observable<any> {
        return this.api.delete<any>(`api/cameras/${id}/`);
    }

    getServers(): Observable<any[]> {
        return this.api.get<any[]>('api/servers/');
    }

    createServer(data: any): Observable<any> {
        return this.api.post<any>('api/servers/', data);
    }

    updateServer(id: number, data: any): Observable<any> {
        return this.api.put<any>(`api/servers/${id}/`, data);
    }

    deleteServer(id: number): Observable<any> {
        return this.api.delete<any>(`api/servers/${id}/`);
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
