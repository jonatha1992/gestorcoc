import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AssetsComponent } from './pages/assets/assets';
import { NovedadesComponent } from './pages/novedades/novedades';
import { PersonnelComponent } from './pages/personnel/personnel';
import { RecordsComponent } from './pages/records/records';
import { HashComponent } from './pages/hash/hash';
import { HechosComponent } from './pages/hechos/hechos';
import { InformesComponent } from './pages/informes/informes';
import { SettingsComponent } from './pages/settings/settings';
import { LoginComponent } from './pages/login/login';
import { UsuariosComponent } from './pages/usuarios/usuarios';
import { authGuard, loginRedirectGuard, permissionGuard } from './guards/auth.guard';
import { PermissionCodes } from './auth/auth.models';

export const routes: Routes = [
    { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
    {
        path: '',
        component: HomeComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.VIEW_DASHBOARD] }
    },
    {
        path: 'assets',
        component: AssetsComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.VIEW_ASSETS] }
    },
    {
        path: 'novedades',
        component: NovedadesComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.VIEW_NOVEDADES] }
    },
    {
        path: 'personnel',
        component: PersonnelComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.VIEW_PERSONNEL] }
    },
    {
        path: 'records',
        component: RecordsComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.VIEW_RECORDS] }
    },
    {
        path: 'hechos',
        component: HechosComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.VIEW_HECHOS] }
    },
    {
        path: 'integrity',
        component: HashComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.USE_INTEGRITY] }
    },
    {
        path: 'informes',
        component: InformesComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.USE_REPORTS] }
    },
    {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.MANAGE_USERS] }
    },
    {
        path: 'sistema',
        loadComponent: () => import('./pages/sistema/sistema.component').then(c => c.SistemaComponent),
        canActivate: [authGuard, permissionGuard],
        data: { permissions: [PermissionCodes.MANAGE_USERS] }
    },
    { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];

