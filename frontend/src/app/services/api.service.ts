import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    private url(path: string): string {
        return this.baseUrl ? `${this.baseUrl}/${path}` : `/${path}`;
    }

    get<T>(path: string): Observable<T> {
        return this.http.get<T>(this.url(path));
    }

    post<T>(path: string, body: any): Observable<T> {
        return this.http.post<T>(this.url(path), body);
    }

    put<T>(path: string, body: any): Observable<T> {
        return this.http.put<T>(this.url(path), body);
    }

    patch<T>(path: string, body: any): Observable<T> {
        return this.http.patch<T>(this.url(path), body);
    }

    delete<T>(path: string): Observable<T> {
        return this.http.delete<T>(this.url(path));
    }
}
