import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../services/loading.service';

@Component({
    selector: 'app-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (loadingService.isLoading()) {
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center">
        <div class="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center gap-3">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <span class="text-slate-700 font-medium text-sm animate-pulse">Cargando...</span>
        </div>
      </div>
    }
  `
})
export class SpinnerComponent {
    loadingService = inject(LoadingService);
}
