import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureSession().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login'], {
          queryParams: state.url && state.url !== '/' ? { redirectTo: state.url } : undefined,
        });
      }

      if (user.must_change_password && state.url !== '/settings') {
        return router.createUrlTree(['/settings']);
      }

      return true;
    }),
  );
};

export const loginRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ensureSession().pipe(
    map((user) => {
      if (!user) {
        return true;
      }
      return router.createUrlTree([user.must_change_password ? '/settings' : '/']);
    }),
  );
};

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredPermissions = (route.data?.['permissions'] as string[] | undefined) ?? [];

  return authService.ensureSession().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }
      if (!requiredPermissions.length || authService.hasAnyPermission(requiredPermissions)) {
        return true;
      }
      return router.createUrlTree(['/']);
    }),
  );
};
