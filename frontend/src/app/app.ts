import { Component, HostListener } from '@angular/core';
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
  private hasInitializedViewport = false;

  constructor(private router: Router) {
    this.syncSidebarWithViewport();
    this.setPageTitle(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.setPageTitle(event.url);
    });
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.syncSidebarWithViewport();
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  private syncSidebarWithViewport() {
    const isMobileViewport = window.innerWidth < 1024;
    if (isMobileViewport && !this.hasInitializedViewport) {
      this.isSidebarCollapsed = true;
    }
    if (!isMobileViewport) {
      this.hasInitializedViewport = false;
      return;
    }
    this.hasInitializedViewport = true;
  }

  private setPageTitle(url: string) {
    if (url.includes('/assets')) {
      this.pageTitle = 'Inventario de Equipamiento';
    } else if (url.includes('/novedades')) {
      this.pageTitle = 'Novedades de CCTV y Equipamiento';
    } else if (url.includes('/hechos')) {
      this.pageTitle = 'Bitacora Operativa';
    } else if (url.includes('/personnel')) {
      this.pageTitle = 'Gestion de Personal';
    } else if (url.includes('/records')) {
      this.pageTitle = 'Registros Filmicos-Informes';
    } else if (url.includes('/integrity')) {
      this.pageTitle = 'Verificacion de Integridad';
    } else if (url.includes('/informes')) {
      this.pageTitle = 'Generador de Informes';
    } else if (url.includes('/settings')) {
      this.pageTitle = 'Configuracion';
    } else {
      this.pageTitle = 'Dashboard';
    }
  }
}
