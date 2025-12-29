import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { GroupService } from './group.service';
import { OrganizationalGroup, User } from '../models';
import { map, switchMap, of, Observable, shareReplay } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root'
})
export class OrganizationAccessService {
    private authService = inject(AuthService);
    private groupService = inject(GroupService);

    /**
     * Observable that resolves the allowed Unit and System IDs for the current user.
     * If the user is an admin, it returns null (meaning 'all').
     */
    allowedAccess$ = toObservable(this.authService.user).pipe(
        switchMap((user: User | null) => {
            if (!user) return of({ units: [], systems: [], isAdmin: false });

            const isAdmin = user.roleIds?.includes('admin');
            if (isAdmin) return of({ units: null, systems: null, isAdmin: true });

            if (!user.orgGroupIds || user.orgGroupIds.length === 0) {
                return of({ units: [], systems: [], isAdmin: false });
            }

            // Fetch all groups assigned to the user
            return this.groupService.getGroups().pipe(
                map(allGroups => {
                    const userGroups = allGroups.filter(g => user.orgGroupIds?.includes(g.id!));

                    const unitIds = new Set<string>();
                    const systemIds = new Set<string>();

                    userGroups.forEach(group => {
                        group.unitIds?.forEach(id => unitIds.add(id));
                        group.systemIds?.forEach(id => systemIds.add(id));
                    });

                    return {
                        units: Array.from(unitIds),
                        systems: Array.from(systemIds),
                        isAdmin: false
                    };
                })
            );
        }),
        shareReplay(1)
    );

    /**
     * Helper to check if the user has access to a specific unit
     */
    async canAccessUnit(unitId: string): Promise<boolean> {
        return new Promise(resolve => {
            this.allowedAccess$.subscribe((access: any) => {
                if (access.units === null) resolve(true); // Admin
                resolve(access.units.includes(unitId));
            });
        });
    }
}
