import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home';
import { AssetsComponent } from './pages/assets';
import { NovedadesComponent } from './pages/novedades';
import { PersonnelComponent } from './pages/personnel';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'assets', component: AssetsComponent },
    { path: 'novedades', component: NovedadesComponent },
    { path: 'personnel', component: PersonnelComponent },
    { path: '**', redirectTo: '' }
];
