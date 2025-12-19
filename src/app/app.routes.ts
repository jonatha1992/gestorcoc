import { Routes } from '@angular/router';
import { EquipmentListComponent } from './pages/equipment-list/equipment-list';
import { EquipmentFormComponent } from './pages/equipment-form/equipment-form';
import { FilmRecordListComponent } from './pages/film-record-list/film-record-list';
import { FilmRecordFormComponent } from './pages/film-record-form/film-record-form';

export const routes: Routes = [
    { path: '', redirectTo: 'equipamiento', pathMatch: 'full' },
    { path: 'equipamiento', component: EquipmentListComponent },
    { path: 'nuevo-equipo', component: EquipmentFormComponent },
    { path: 'editar-equipo/:id', component: EquipmentFormComponent },
    { path: 'registros', component: FilmRecordListComponent },
    { path: 'nuevo-registro', component: FilmRecordFormComponent },
    { path: 'editar-registro/:id', component: FilmRecordFormComponent },
];
