import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home';
import { AssetsComponent } from './pages/assets';
import { NovedadesComponent } from './pages/novedades';
import { PersonnelComponent } from './pages/personnel';
import { RecordsComponent } from './pages/records';
import { HashComponent } from './pages/hash';
import { HechosComponent } from './pages/hechos/hechos';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'assets', component: AssetsComponent },
    { path: 'novedades', component: NovedadesComponent },
    { path: 'personnel', component: PersonnelComponent },
    { path: 'records', component: RecordsComponent },
    { path: 'hechos', component: HechosComponent },
    { path: 'integrity', component: HashComponent },
    { path: '**', redirectTo: '' }
];
