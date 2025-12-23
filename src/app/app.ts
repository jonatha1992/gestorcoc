import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ToastComponent } from './components/ui/toast/toast';
import { ConfirmModalComponent } from './components/ui/confirm-modal/confirm-modal';
import { LoadingComponent } from './components/ui/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent, ConfirmModalComponent, LoadingComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navbar></app-navbar>
      <main class="container mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Global UI components -->
      <app-toast-container></app-toast-container>
      <app-confirm-modal></app-confirm-modal>
      <app-loading></app-loading>
    </div>
  `,
})
export class AppComponent {
  title = 'Equipamiento y Registros CREV';
}
