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
}
