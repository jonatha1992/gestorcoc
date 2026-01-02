import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, HasPermissionDirective],
    template: `
    <aside class="h-screen flex flex-col bg-gray-900 border-r border-gray-800 text-gray-300 w-64 fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl">
      <!-- Header / Logo -->
      <div class="p-6 flex items-center gap-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span class="text-xl">🛡️</span>
        </div>
        <div>
          <h1 class="font-bold text-white tracking-tight">CREV</h1>
          <p class="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">System</p>
        </div>
      </div>

      <!-- User Profile (Compact) -->
      <div class="px-6 py-6" *ngIf="user()">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
            {{ (user()?.displayName || 'U')[0].toUpperCase() }}
          </div>
          <div class="overflow-hidden">
            <p class="text-sm font-bold text-white truncate">{{ user()?.displayName }}</p>
            <p class="text-xs text-gray-500 truncate capitalize">{{ userRoles()[0]?.replace('_', ' ') }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation Content -->
      <nav class="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar pb-6">
        
        <!-- Main Section -->
        <div>
          <h3 class="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Principal</h3>
          <ul class="space-y-1">
            <li>
              <a routerLink="/home" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600" 
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">🏠</span>
                Inicio
              </a>
            </li>
          </ul>
        </div>

        <!-- Operations Section -->
        <div>
          <h3 class="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Operaciones</h3>
          <ul class="space-y-1">
            <!-- Hechos -->
            <li *appHasPermission="['hechos', 'read']">
              <a routerLink="/hechos" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                 <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">📝</span>
                 Hechos
              </a>
            </li>
            
            <!-- Mesa de Entrada -->
            <li *appHasPermission="['documents', 'read']">
              <a routerLink="/documents" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                 <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">📂</span>
                 Mesa de Entrada
              </a>
            </li>

            <!-- Equipamiento Dropdown (Simplified as link for now, or could be collapsible) -->
            <li *appHasPermission="['equipamiento', 'read']">
                <div class="px-2 py-1">
                    <button (click)="toggleSection('equip')" class="flex items-center justify-between w-full px-1 py-1 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        <span class="flex items-center gap-2"><span class="text-lg">🖥️</span> Equipamiento</span>
                        <span class="text-xs transition-transform duration-200" [class.rotate-180]="sections.equip">▼</span>
                    </button>
                    <div class="mt-2 space-y-1 pl-8 border-l border-gray-800 ml-3" *ngIf="sections.equip">
                        <a routerLink="/equipamiento/list" routerLinkActive="text-indigo-400" class="block px-2 py-1.5 text-xs rounded hover:bg-gray-800/50 hover:text-white transition-colors">Listado</a>
                        <a *appHasPermission="['equipamiento', 'create']" routerLink="/equipamiento/new" routerLinkActive="text-indigo-400" class="block px-2 py-1.5 text-xs rounded hover:bg-gray-800/50 hover:text-white transition-colors">Nuevo</a>
                    </div>
                </div>
            </li>
          </ul>
        </div>

        <!-- Utilities Section -->
        <div>
          <h3 class="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Utilidades</h3>
          <ul class="space-y-1">
            <li *appHasPermission="['utilities', 'read']">
              <a routerLink="/hashes" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                 <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">🔐</span>
                 Hash Tool
              </a>
            </li>
             <li *appHasPermission="['camaras', 'read']">
              <a routerLink="/tools/vms-migration" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                 <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">📹</span>
                 Migración Cámaras
              </a>
            </li>
          </ul>
        </div>

        <!-- Config Section -->
        <div>
          <h3 class="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Configuración</h3>
          <ul class="space-y-1">
             <li *appHasPermission="['catalogos', 'read']">
              <a routerLink="/catalogs" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                 <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">📚</span>
                 Catálogos
              </a>
            </li>
            <li *appHasPermission="['usuarios', 'read']">
              <a routerLink="/users" routerLinkActive="bg-indigo-600/10 text-indigo-400 border-indigo-600"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-all border-l-2 border-transparent group">
                 <span class="text-lg opacity-70 group-hover:opacity-100 group-[.text-indigo-400]:opacity-100">👥</span>
                 Usuarios
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Footer / Logout -->
      <div class="p-4 border-t border-gray-800 bg-gray-900/50">
        <button (click)="logout()" class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all group">
          <span class="text-lg group-hover:-translate-x-1 transition-transform">🚪</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(31, 41, 55, 0.5);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(75, 85, 99, 0.5);
      border-radius: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(107, 114, 128, 0.8);
    }
  `]
})
export class SidebarComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    user = this.authService.user;
    userRoles = this.authService.userRoles;

    sections = {
        equip: false,
        crev: false
    };

    toggleSection(section: 'equip' | 'crev') {
        this.sections[section] = !this.sections[section];
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/login']);
    }
}
