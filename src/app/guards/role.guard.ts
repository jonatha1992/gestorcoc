import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Guard to check if user has the required roles
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    const requiredRoles = route.data?.['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No roles required
    }

    if (authService.hasAnyRole(requiredRoles)) {
        return true;
    }

    // Access denied
    console.warn(`Access denied for route ${state.url}. Required roles: ${requiredRoles.join(', ')}`);
    toastService.error('No tienes permisos suficientes para acceder a esta sección');

    // Redirect to home or previous page
    router.navigate(['/']);
    return false;
};
