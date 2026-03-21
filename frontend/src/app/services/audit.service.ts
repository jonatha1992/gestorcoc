import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface AuditLogFilters {
    search?: string;
    username?: string;
    action?: string;
    method?: string;
    target_model?: string;
    status_code?: number | '';
    created_at__gte?: string;
    created_at__lte?: string;
    ordering?: string;
    page?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    constructor(private api: ApiService, private http: HttpClient) { }

    getLogs(filters: AuditLogFilters = {}): Observable<any> {
        const params: string[] = [];
        const page = filters.page || 1;
        params.push(`page=${page}`);

        if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
        if (filters.username) params.push(`username=${encodeURIComponent(filters.username)}`);
        if (filters.action) params.push(`action=${encodeURIComponent(filters.action)}`);
        if (filters.method) params.push(`method=${encodeURIComponent(filters.method)}`);
        if (filters.target_model) params.push(`target_model=${encodeURIComponent(filters.target_model)}`);
        if (filters.status_code) params.push(`status_code=${filters.status_code}`);
        if (filters.created_at__gte) params.push(`created_at__gte=${encodeURIComponent(filters.created_at__gte)}`);
        if (filters.created_at__lte) params.push(`created_at__lte=${encodeURIComponent(filters.created_at__lte)}`);
        if (filters.ordering) params.push(`ordering=${encodeURIComponent(filters.ordering)}`);

        return this.api.get<any>(`api/audit-logs/?${params.join('&')}`);
    }
}
