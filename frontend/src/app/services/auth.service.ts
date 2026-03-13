import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AUTH_RETRY, AUTH_SKIP } from '../interceptors/auth.interceptor';
import {
  AuthenticatedUser,
  AuthTokens,
  LoginResponse,
  PermissionCode,
  RoleLabels,
} from '../auth/auth.models';

const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userState = signal<AuthenticatedUser | null>(null);
  private readonly initializedState = signal(false);
  private readonly loadingState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly initialized = this.initializedState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userState());

  private bootstrapRequest$?: Observable<AuthenticatedUser | null>;
  private refreshRequest$?: Observable<AuthTokens>;

  private url(path: string): string {
    return environment.apiUrl ? `${environment.apiUrl}/${path}` : `/${path}`;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        this.url('api/auth/login/'),
        { username, password },
        {
          context: new HttpContext().set(AUTH_SKIP, true).set(AUTH_RETRY, false),
        },
      )
      .pipe(
        tap((response) => {
          this.storeTokens(response);
          this.userState.set(response.user);
          this.initializedState.set(true);
        }),
      );
  }

  ensureSession(): Observable<AuthenticatedUser | null> {
    if (this.userState()) {
      return of(this.userState());
    }

    if (!this.getAccessToken()) {
      this.clearSession();
      this.initializedState.set(true);
      return of(null);
    }

    if (this.bootstrapRequest$) {
      return this.bootstrapRequest$;
    }

    this.loadingState.set(true);
    this.bootstrapRequest$ = this.fetchMe().pipe(
      catchError((error) => {
        if (!this.hasRefreshToken()) {
          this.clearSession();
          return of(null);
        }
        return this.refreshToken().pipe(
          switchMap(() => this.fetchMe()),
          catchError(() => {
            this.clearSession();
            return of(null);
          }),
        );
      }),
      tap((user) => {
        this.userState.set(user);
        this.initializedState.set(true);
      }),
      finalize(() => {
        this.loadingState.set(false);
        this.bootstrapRequest$ = undefined;
      }),
      shareReplay(1),
    );

    return this.bootstrapRequest$;
  }

  refreshToken(): Observable<AuthTokens> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No hay refresh token disponible.'));
    }

    this.refreshRequest$ = this.http
      .post<Partial<AuthTokens>>(
        this.url('api/auth/refresh/'),
        { refresh },
        {
          context: new HttpContext().set(AUTH_SKIP, true).set(AUTH_RETRY, false),
        },
      )
      .pipe(
        map((response) => ({
          access: response.access || '',
          refresh: response.refresh || refresh,
        })),
        tap((tokens) => {
          if (!tokens.access) {
            throw new Error('Respuesta de refresh invalida.');
          }
          this.storeTokens(tokens);
        }),
        finalize(() => {
          this.refreshRequest$ = undefined;
        }),
        shareReplay(1),
      );

    return this.refreshRequest$;
  }

  changePassword(payload: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Observable<AuthenticatedUser> {
    return this.http
      .post<{ user: AuthenticatedUser }>(this.url('api/auth/change-password/'), payload)
      .pipe(
        map((response) => response.user),
        tap((user) => {
          this.userState.set(user);
        }),
      );
  }

  logout(navigate = true) {
    const hasToken = !!this.getAccessToken();
    if (hasToken) {
      this.http
        .post(
          this.url('api/auth/logout/'),
          {},
          {
            context: new HttpContext().set(AUTH_RETRY, false),
          },
        )
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clearSession();
    if (navigate) {
      void this.router.navigate(['/login']);
    }
  }

  handleAuthFailure() {
    const currentUrl = this.router.url || '/';
    this.clearSession();
    if (!currentUrl.startsWith('/login')) {
      void this.router.navigate(['/login'], {
        queryParams: currentUrl && currentUrl !== '/' ? { redirectTo: currentUrl } : undefined,
      });
    }
  }

  hasPermission(code: PermissionCode | string): boolean {
    return !!this.userState()?.permission_codes.includes(code);
  }

  hasAnyPermission(codes: readonly (PermissionCode | string)[]): boolean {
    if (!codes.length) {
      return true;
    }
    return codes.some((code) => this.hasPermission(code));
  }

  roleLabel(role: string | null | undefined): string {
    if (!role) {
      return 'Sin rol';
    }
    return RoleLabels[role] ?? role;
  }

  private fetchMe(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>(this.url('api/auth/me/'));
  }

  private storeTokens(tokens: Partial<AuthTokens>) {
    if (tokens.access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    }
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    }
  }

  private clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.userState.set(null);
  }
}
