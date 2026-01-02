import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/ui/toast/toast';
import { ConfirmModalComponent } from './components/ui/confirm-modal/confirm-modal';
import { LoadingComponent } from './components/ui/loading/loading.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent, ConfirmModalComponent, LoadingComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <!-- Sidebar (Visible only when authenticated) -->
      @if (authService.isAuthenticated()) {
        <app-sidebar class="shrink-0" />
      }

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto relative custom-scrollbar-main">
        <div class="container mx-auto px-4 py-8" [class.ml-64]="authService.isAuthenticated()">
          <router-outlet></router-outlet>
        </div>
      </main>
      
      <!-- Global UI components -->
      <app-toast-container></app-toast-container>
      <app-confirm-modal></app-confirm-modal>
      <app-loading></app-loading>
    </div>
  `,
  styles: [`
    .custom-scrollbar-main::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar-main::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar-main::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 4px;
    }
    .custom-scrollbar-main::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.7);
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
  title = 'Equipamiento y Registros CREV';
}
