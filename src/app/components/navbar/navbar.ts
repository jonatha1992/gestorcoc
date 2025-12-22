import { Component, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  isEquipMenuOpen = signal(false);
  isCrevMenuOpen = signal(false);
  isCameraMenuOpen = signal(false);
  isCatalogMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Cerrar menús al hacer click fuera
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu')) {
      this.closeAllDropdowns();
    }
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

  closeAllDropdowns() {
    this.isEquipMenuOpen.set(false);
    this.isCrevMenuOpen.set(false);
    this.isCameraMenuOpen.set(false);
    this.isCatalogMenuOpen.set(false);
  }

  closeMenus() {
    this.closeAllDropdowns();
    this.isMobileMenuOpen.set(false);
  }
}
