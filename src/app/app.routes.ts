import { Routes } from '@angular/router';
import { EquipmentListComponent } from './pages/equipment-list/equipment-list';
import { EquipmentFormComponent } from './pages/equipment-form/equipment-form';
import { FilmRecordListComponent } from './pages/film-record-list/film-record-list';
import { FilmRecordFormComponent } from './pages/film-record-form/film-record-form';
import { CameraListComponent } from './pages/camera-list/camera-list';
import { CameraFormComponent } from './pages/camera-form/camera-form';
import { CatalogListComponent } from './pages/catalog-list/catalog-list';
import { UserListComponent } from './pages/user-list/user-list';
import { LoginPageComponent } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: 'login', component: LoginPageComponent },
    { path: '', redirectTo: 'equipamiento', pathMatch: 'full' },

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
];
