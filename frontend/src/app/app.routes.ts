import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home';
import { AssetsComponent } from './pages/assets';
import { NovedadesComponent } from './pages/novedades';
import { PersonnelComponent } from './pages/personnel';
<<<<<<< HEAD
=======
import { RecordsComponent } from './pages/records';
import { HashComponent } from './pages/hash';
import { HechosComponent } from './pages/hechos/hechos';
>>>>>>> dev

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'assets', component: AssetsComponent },
    { path: 'novedades', component: NovedadesComponent },
    { path: 'personnel', component: PersonnelComponent },
<<<<<<< HEAD
=======
    { path: 'records', component: RecordsComponent },
    { path: 'hechos', component: HechosComponent },
    { path: 'integrity', component: HashComponent },
>>>>>>> dev
    { path: '**', redirectTo: '' }
];
