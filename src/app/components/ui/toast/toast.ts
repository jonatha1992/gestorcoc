import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border flex items-center justify-between animate-slide-in"
          [ngClass]="{
            'bg-green-50 border-green-200 text-green-800': toast.type === 'success',
            'bg-red-50 border-red-200 text-red-800': toast.type === 'error',
            'bg-blue-50 border-blue-200 text-blue-800': toast.type === 'info',
            'bg-yellow-50 border-yellow-200 text-yellow-800': toast.type === 'warning'
          }"
        >
          <div class="flex items-center gap-3">
            @switch (toast.type) {
              @case ('success') { <span class="text-xl">✅</span> }
              @case ('error') { <span class="text-xl">❌</span> }
              @case ('warning') { <span class="text-xl">⚠️</span> }
              @case ('info') { <span class="text-xl">ℹ️</span> }
            }
            <span class="font-medium">{{ toast.message }}</span>
          </div>
          <button 
            (click)="toastService.remove(toast.id)"
            class="ml-4 hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out forwards;
    }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);
}
