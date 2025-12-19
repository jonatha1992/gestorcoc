import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  isEquipMenuOpen = signal(false);
  isCrevMenuOpen = signal(false);
  isMobileMenuOpen = signal(false);

  toggleEquipMenu() {
    this.isEquipMenuOpen.set(!this.isEquipMenuOpen());
    this.isCrevMenuOpen.set(false);
  }

  toggleCrevMenu() {
    this.isCrevMenuOpen.set(!this.isCrevMenuOpen());
    this.isEquipMenuOpen.set(false);
  }

  closeMenus() {
    this.isEquipMenuOpen.set(false);
    this.isCrevMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }
}
