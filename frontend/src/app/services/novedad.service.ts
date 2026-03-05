import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface NovedadFilters {
  search?: string;
  status?: string;
  severity?: string;
  incident_type?: string;
  asset_type?: 'CAMERA' | 'SERVER' | 'SYSTEM' | 'GEAR';
  created_at__gte?: string;
  created_at__lte?: string;
  reported_by?: string;
  camera?: number | string;
  server?: number | string;
  system?: number | string;
  cameraman_gear?: number | string;
}

@Injectable({
  providedIn: 'root',
})
export class NovedadService {
  constructor(private api: ApiService) {}

  getNovedades(page = 1, filters: NovedadFilters = {}): Observable<any> {
    const params: string[] = [`page=${page}`];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.status) params.push(`status=${filters.status}`);
    if (filters.severity) params.push(`severity=${filters.severity}`);
    if (filters.incident_type) params.push(`incident_type=${encodeURIComponent(filters.incident_type)}`);
    if (filters.asset_type) params.push(`asset_type=${filters.asset_type}`);
    if (filters.created_at__gte) params.push(`created_at__gte=${encodeURIComponent(filters.created_at__gte)}`);
    if (filters.created_at__lte) params.push(`created_at__lte=${encodeURIComponent(filters.created_at__lte)}`);
    if (filters.reported_by) params.push(`reported_by=${encodeURIComponent(filters.reported_by)}`);
    if (filters.camera !== undefined && filters.camera !== null && filters.camera !== '') {
      params.push(`camera=${encodeURIComponent(String(filters.camera))}`);
    }
    if (filters.server !== undefined && filters.server !== null && filters.server !== '') {
      params.push(`server=${encodeURIComponent(String(filters.server))}`);
    }
    if (filters.system !== undefined && filters.system !== null && filters.system !== '') {
      params.push(`system=${encodeURIComponent(String(filters.system))}`);
    }
    if (filters.cameraman_gear !== undefined && filters.cameraman_gear !== null && filters.cameraman_gear !== '') {
      params.push(`cameraman_gear=${encodeURIComponent(String(filters.cameraman_gear))}`);
    }
    return this.api.get<any>(`api/novedades/?${params.join('&')}`);
  }

  createNovedad(data: any): Observable<any> {
    return this.api.post<any>('api/novedades/', data);
  }

  deleteNovedad(id: number): Observable<any> {
    return this.api.delete<any>(`api/novedades/${id}/`);
  }

  updateNovedad(id: number, data: any): Observable<any> {
    return this.api.put<any>(`api/novedades/${id}/`, data);
  }
}
