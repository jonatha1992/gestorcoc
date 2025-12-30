import { Routes } from '@angular/router';
import { EquipmentListComponent } from './pages/equipment-list/equipment-list';
import { EquipmentFormComponent } from './pages/equipment-form/equipment-form';
import { FilmRecordListComponent } from './pages/film-record-list/film-record-list';
import { FilmRecordFormComponent } from './pages/film-record-form/film-record-form';
import { CameraListComponent } from './pages/camera-list/camera-list';
import { CameraFormComponent } from './pages/camera-form/camera-form';
import { CatalogListComponent } from './pages/catalog-list/catalog-list';
import { UserListComponent } from './pages/user-list/user-list';
import { UnitListComponent } from './pages/organization/unit-list/unit-list';
import { SystemListComponent } from './pages/organization/system-list/system-list';
import { GroupListComponent } from './pages/organization/group-list/group-list';
import { LoginPageComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: 'login', component: LoginPageComponent },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },

    // Equipamiento
    { path: 'equipamiento', component: EquipmentListComponent, canActivate: [authGuard] },
    {
        path: 'nuevo-equipo',
        component: EquipmentFormComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'operador'] }
    },
    {
        path: 'editar-equipo/:id',
        component: EquipmentFormComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'operador'] }
    },

    // Registros Fílmicos
    { path: 'registros', component: FilmRecordListComponent, canActivate: [authGuard] },
    // Hechos
    {
        path: 'hechos',
        loadComponent: () => import('./pages/hecho-list/hecho-list').then(m => m.HechoListComponent),
        canActivate: [authGuard]
    },
    {
        path: 'hechos/nuevo',
        loadComponent: () => import('./pages/hecho-form/hecho-form').then(m => m.HechoFormComponent),
        canActivate: [authGuard]
    },
    {
        path: 'hechos/editar/:id',
        loadComponent: () => import('./pages/hecho-form/hecho-form').then(m => m.HechoFormComponent),
        canActivate: [authGuard]
    },

    // Registros (Legacy/Filmicos)
    {
        path: 'nuevo-registro',
        component: FilmRecordFormComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'operador'] }
    },
    {
        path: 'editar-registro/:id',
        component: FilmRecordFormComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'operador'] }
    },

    // Cámaras
    { path: 'camaras', component: CameraListComponent, canActivate: [authGuard] },
    {
        path: 'nueva-camara',
        component: CameraFormComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'operador'] }
    },
    {
        path: 'editar-camara/:id',
        component: CameraFormComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'operador'] }
    },

    // Administración
    {
        path: 'roles',
        loadComponent: () => import('./pages/role-list/role-list').then(m => m.RoleListComponent),
        canActivate: [authGuard] // TODO: Add role restriction for admin only
    },
    {
        path: 'catalogos',
        component: CatalogListComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'usuarios',
        component: UserListComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'organización/unidades',
        component: UnitListComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'organización/sistemas',
        component: SystemListComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'organización/grupos',
        component: GroupListComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] }
    },
];
