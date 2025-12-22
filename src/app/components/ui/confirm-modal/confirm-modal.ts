import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../services/confirm.service';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (confirmService.state(); as state) {
      <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" (click)="confirmService.cancel()"></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-zoom-in">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center"
                [ngClass]="{
                  'bg-red-100 text-red-600': state.options.type === 'danger',
                  'bg-yellow-100 text-yellow-600': state.options.type === 'warning',
                  'bg-blue-100 text-blue-600': state.options.type === 'info' || !state.options.type
                }"
              >
                @switch (state.options.type) {
                  @case ('danger') { <span>⚠️</span> }
                  @case ('warning') { <span>⚡</span> }
                  @default { <span>❓</span> }
                }
              </div>
              <h3 class="text-xl font-bold text-gray-900">{{ state.options.title }}</h3>
            </div>
            
            <p class="text-gray-600">{{ state.options.message }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 flex gap-3 justify-end">
            <button 
              (click)="confirmService.cancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {{ state.options.cancelText || 'Cancelar' }}
            </button>
            <button 
              (click)="confirmService.confirm()"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm"
              [ngClass]="{
                'bg-red-600 hover:bg-red-700': state.options.type === 'danger',
                'bg-yellow-600 hover:bg-yellow-700': state.options.type === 'warning',
                'bg-indigo-600 hover:bg-indigo-700': state.options.type === 'info' || !state.options.type
              }"
            >
              {{ state.options.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    @keyframes zoom-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-zoom-in {
      animation: zoom-in 0.2s ease-out forwards;
    }
  `]
})
export class ConfirmModalComponent {
    confirmService = inject(ConfirmService);
}
