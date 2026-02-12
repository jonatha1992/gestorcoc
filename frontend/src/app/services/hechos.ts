import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Hecho {
  id: number;
  timestamp: string;
  description: string;
  category: 'POLICIAL' | 'OPERATIVO' | 'INFORMATIVO' | 'RELEVAMIENTO';
  camera: number | null;
  camera_details?: any;
  reported_by: number | null;
  reported_by_details?: any;
  external_ref?: string;
  // Operational Details
  sector?: string;
  elements?: string;
  intervening_groups?: string;

  // Resolution flags
  is_solved?: boolean;
  coc_intervention?: boolean;
  generated_cause?: boolean;

  // End/Resolution
  end_time?: string;
  resolution_time?: string;
  resolution_details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HechosService {
  private api = inject(ApiService);
  private endpoint = 'api/hechos/';

  getHechos(): Observable<Hecho[]> {
    return this.api.get<Hecho[]>(this.endpoint);
  }

  createHecho(hecho: Partial<Hecho>): Observable<Hecho> {
    return this.api.post<Hecho>(this.endpoint, hecho);
  }

  updateHecho(id: number, hecho: Partial<Hecho>): Observable<Hecho> {
    return this.api.patch<Hecho>(`${this.endpoint}${id}/`, hecho);
  }

  deleteHecho(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}${id}/`);
  }
}
