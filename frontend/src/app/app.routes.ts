import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AssetsComponent } from './pages/assets/assets';
import { NovedadesComponent } from './pages/novedades/novedades';
import { PersonnelComponent } from './pages/personnel/personnel';
import { RecordsComponent } from './pages/records/records';
import { HashComponent } from './pages/hash/hash';
import { HechosComponent } from './pages/hechos/hechos';
import { InformesComponent } from './pages/informes/informes';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'assets', component: AssetsComponent },
    { path: 'novedades', component: NovedadesComponent },
    { path: 'personnel', component: PersonnelComponent },
    { path: 'records', component: RecordsComponent },
    { path: 'hechos', component: HechosComponent },
    { path: 'integrity', component: HashComponent },
    { path: 'informes', component: InformesComponent },
    { path: '**', redirectTo: '' }
];
