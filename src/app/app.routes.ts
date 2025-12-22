import { Routes } from '@angular/router';
import { EquipmentListComponent } from './pages/equipment-list/equipment-list';
import { EquipmentFormComponent } from './pages/equipment-form/equipment-form';
import { FilmRecordListComponent } from './pages/film-record-list/film-record-list';
import { FilmRecordFormComponent } from './pages/film-record-form/film-record-form';
import { CameraListComponent } from './pages/camera-list/camera-list';
import { CameraFormComponent } from './pages/camera-form/camera-form';
import { CatalogListComponent } from './pages/catalog-list/catalog-list';

export const routes: Routes = [
    { path: '', redirectTo: 'equipamiento', pathMatch: 'full' },

    // Equipamiento
    { path: 'equipamiento', component: EquipmentListComponent },
    { path: 'nuevo-equipo', component: EquipmentFormComponent },
    { path: 'editar-equipo/:id', component: EquipmentFormComponent },

    // Registros Fílmicos
    { path: 'registros', component: FilmRecordListComponent },
    { path: 'nuevo-registro', component: FilmRecordFormComponent },
    { path: 'editar-registro/:id', component: FilmRecordFormComponent },

    // Cámaras
    { path: 'camaras', component: CameraListComponent },
    { path: 'nueva-camara', component: CameraFormComponent },
    { path: 'editar-camara/:id', component: CameraFormComponent },

    // Catálogos
    { path: 'catalogos', component: CatalogListComponent },
];
