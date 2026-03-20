import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SystemUser {
    id: number;
    user_id: number | null;
    username: string;
    first_name: string;
    last_name: string;
    badge_number: string;
    role: string;
    role_display: string;
    rank: string;
    unit: string | null;
    unit_name: string | null;
    is_active: boolean;
    user_is_active: boolean;
    must_change_password: boolean;
    last_login: string | null;
    has_account: boolean;
}

export interface CreateUserPayload {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    badge_number: string;
    role: string;
    rank: string;
    unit: string;
    person_id?: number;
}

export interface UpdateUserPayload {
    first_name?: string;
    last_name?: string;
    badge_number?: string;
    rank?: string;
    role?: string;
    unit?: string | null;
    is_active?: boolean;
    user_is_active?: boolean;
    password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
    constructor(private api: ApiService) { }

    getUsers(page = 1, search = '', role = '', unit = ''): Observable<any> {
        const params: string[] = [`page=${page}`];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (role) params.push(`role=${encodeURIComponent(role)}`);
        if (unit) params.push(`unit__code=${encodeURIComponent(unit)}`);
        return this.api.get<any>(`api/users/?${params.join('&')}`);
    }

    createUser(payload: CreateUserPayload): Observable<SystemUser> {
        return this.api.post<SystemUser>('api/users/', payload);
    }

    updateUser(id: number, payload: UpdateUserPayload): Observable<SystemUser> {
        return this.api.patch<SystemUser>(`api/users/${id}/`, payload);
    }

    toggleActive(id: number): Observable<{ is_active: boolean; user_is_active: boolean }> {
        return this.api.post<any>(`api/users/${id}/toggle_active/`, {});
    }

    resetPassword(id: number, password: string): Observable<{ message: string }> {
        return this.api.post<any>(`api/users/${id}/reset_password/`, { password });
    }

    deactivateUser(id: number): Observable<void> {
        return this.api.delete<void>(`api/users/${id}/`);
    }
}
