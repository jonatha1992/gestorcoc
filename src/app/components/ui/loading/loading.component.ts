import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingService.loading$ | async" class="fixed inset-0 z-[100] flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm transition-opacity">
      <div class="flex flex-col items-center">
        <!-- Spinner profesional (Ring) -->
        <div class="relative w-16 h-16">
          <div class="absolute w-full h-full border-4 border-indigo-200 rounded-full opacity-25"></div>
          <div class="absolute w-full h-full border-4 border-transparent border-t-indigo-600 border-r-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p class="mt-4 text-indigo-700 font-medium tracking-wide animate-pulse">Cargando...</p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
