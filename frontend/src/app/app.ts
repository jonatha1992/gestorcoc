import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SpinnerComponent } from './components/spinner.component';
import { ToastComponent } from './components/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, SpinnerComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Gestor COC';
  pageTitle = 'Dashboard';
  isSidebarCollapsed = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.setPageTitle(event.url);
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  private setPageTitle(url: string) {
    if (url.includes('/assets')) {
      this.pageTitle = 'Inventario de Equipamiento';
    } else if (url.includes('/novedades')) {
      this.pageTitle = 'Libro de Novedades';
    } else if (url.includes('/hechos')) {
      this.pageTitle = 'Bitácora Operativa';
    } else if (url.includes('/personnel')) {
      this.pageTitle = 'Gestión de Personal';
    } else if (url.includes('/records')) {
      this.pageTitle = 'Registros Fílmicos';
    } else if (url.includes('/integrity')) {
      this.pageTitle = 'Verificación de Integridad';
    } else if (url.includes('/settings')) {
      this.pageTitle = 'Configuración';
    } else {
      this.pageTitle = 'Dashboard';
    }
  }
}
