import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterLink, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule, HasPermissionDirective],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated = this.authService.isAuthenticated;
  user = this.authService.user;

  isEquipMenuOpen = signal(false);
  isCrevMenuOpen = signal(false);
  isCameraMenuOpen = signal(false);
  isCatalogMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);
  isUserMenuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Cerrar menús al hacer click fuera
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu')) {
      this.closeAllDropdowns();
    }
  }

  toggleUserMenu() {
    const isOpen = !this.isUserMenuOpen();
    this.closeAllDropdowns();
    this.isUserMenuOpen.set(isOpen);
  }

  toggleEquipMenu() {
    const isOpen = !this.isEquipMenuOpen();
    this.closeAllDropdowns();
    this.isEquipMenuOpen.set(isOpen);
  }

  toggleCrevMenu() {
    const isOpen = !this.isCrevMenuOpen();
    this.closeAllDropdowns();
    this.isCrevMenuOpen.set(isOpen);
  }

  toggleCameraMenu() {
    const isOpen = !this.isCameraMenuOpen();
    this.closeAllDropdowns();
    this.isCameraMenuOpen.set(isOpen);
  }

  toggleCatalogMenu() {
    const isOpen = !this.isCatalogMenuOpen();
    this.closeAllDropdowns();
    this.isCatalogMenuOpen.set(isOpen);
  }

  async logout() {
    await this.authService.logout();
    this.closeMenus();
    this.router.navigate(['/login']);
  }

  closeAllDropdowns() {
    this.isEquipMenuOpen.set(false);
    this.isCrevMenuOpen.set(false);
    this.isCameraMenuOpen.set(false);
    this.isCatalogMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
  }

  closeMenus() {
    this.closeAllDropdowns();
    this.isMobileMenuOpen.set(false);
  }
}
