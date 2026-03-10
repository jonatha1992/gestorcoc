import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type DashboardModule = 'novedades' | 'hechos' | 'records' | 'personnel';

export interface DashboardCard {
  id: string;
  label: string;
  value: number;
}

export interface DashboardSeriesPoint {
  key?: string;
  label: string;
  value: number;
}

export interface DashboardModuleResponse {
  module: DashboardModule;
  cards: DashboardCard[];
  series: {
    trend: DashboardSeriesPoint[];
    distribution_primary: DashboardSeriesPoint[];
    distribution_secondary: DashboardSeriesPoint[];
  };
  totals: { records: number };
  empty_state: {
    is_empty: boolean;
    message: string;
  };
}

export interface DashboardMapPoint {
  unit_code: string;
  unit_name: string;
  airport: string | null;
  lat: number;
  lon: number;
  novedades_count: number;
  hechos_count: number;
  records_count: number;
  cameras_online: number;
  cameras_offline: number;
  last_event_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private api: ApiService) {}

  getNovedades(filters: Record<string, unknown> = {}): Observable<DashboardModuleResponse> {
    return this.api.get<DashboardModuleResponse>(`api/dashboard/novedades/?${this.buildQuery(filters)}`);
  }

  getHechos(filters: Record<string, unknown> = {}): Observable<DashboardModuleResponse> {
    return this.api.get<DashboardModuleResponse>(`api/dashboard/hechos/?${this.buildQuery(filters)}`);
  }

  getRecords(filters: Record<string, unknown> = {}): Observable<DashboardModuleResponse> {
    return this.api.get<DashboardModuleResponse>(`api/dashboard/records/?${this.buildQuery(filters)}`);
  }

  getPersonnel(filters: Record<string, unknown> = {}): Observable<DashboardModuleResponse> {
    return this.api.get<DashboardModuleResponse>(`api/dashboard/personnel/?${this.buildQuery(filters)}`);
  }

  getMap(scope = 'ba', filters: Record<string, unknown> = {}): Observable<{ scope: string; points: DashboardMapPoint[] }> {
    const query = this.buildQuery({ scope, ...filters });
    return this.api.get<{ scope: string; points: DashboardMapPoint[] }>(`api/dashboard/map/?${query}`);
  }

  private buildQuery(filters: Record<string, unknown>): string {
    const params: string[] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
    return params.join('&');
  }
}
