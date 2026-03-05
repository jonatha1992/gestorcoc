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

export interface HechoFilters {
  search?: string;
  category?: string;
  is_solved?: string;
  camera?: number | string;
  coc_intervention?: string;
  generated_cause?: string;
  timestamp__gte?: string;
  timestamp__lte?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HechosService {
  private api = inject(ApiService);
  private endpoint = 'api/hechos/';

  getHechos(page = 1, filters: HechoFilters = {}): Observable<any> {
    const params: string[] = [`page=${page}`];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.category) params.push(`category=${filters.category}`);
    if (filters.is_solved !== undefined && filters.is_solved !== '') params.push(`is_solved=${filters.is_solved}`);
    if (filters.camera !== undefined && filters.camera !== null && filters.camera !== '') {
      params.push(`camera=${encodeURIComponent(String(filters.camera))}`);
    }
    if (filters.coc_intervention !== undefined && filters.coc_intervention !== '') {
      params.push(`coc_intervention=${filters.coc_intervention}`);
    }
    if (filters.generated_cause !== undefined && filters.generated_cause !== '') {
      params.push(`generated_cause=${filters.generated_cause}`);
    }
    if (filters.timestamp__gte) params.push(`timestamp__gte=${encodeURIComponent(filters.timestamp__gte)}`);
    if (filters.timestamp__lte) params.push(`timestamp__lte=${encodeURIComponent(filters.timestamp__lte)}`);
    return this.api.get<any>(`${this.endpoint}?${params.join('&')}`);
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
