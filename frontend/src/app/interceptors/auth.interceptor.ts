import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const AUTH_SKIP = new HttpContextToken<boolean>(() => false);
export const AUTH_RETRY = new HttpContextToken<boolean>(() => true);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const shouldSkip = req.context.get(AUTH_SKIP);
  const canRetry = req.context.get(AUTH_RETRY);

  const accessToken = authService.getAccessToken();
  const authReq =
    shouldSkip || !accessToken
      ? req
      : req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

  return next(authReq).pipe(
    catchError((error) => {
      const isUnauthorized = error?.status === 401;
      if (!isUnauthorized || !canRetry || shouldSkip || !authService.hasRefreshToken()) {
        if (isUnauthorized && !shouldSkip) {
          authService.handleAuthFailure();
        }
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((tokens) => {
          const retryRequest = req.clone({
            context: req.context.set(AUTH_RETRY, false),
            setHeaders: {
              Authorization: `Bearer ${tokens.access}`,
            },
          });
          return next(retryRequest);
        }),
        catchError((refreshError) => {
          authService.handleAuthFailure();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
