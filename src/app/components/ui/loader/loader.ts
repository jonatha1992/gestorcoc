import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div [class]="containerClass" [class.fixed]="fullScreen" [class.inset-0]="fullScreen" [class.z-[99]]="fullScreen">
      @if (fullScreen) {
        <div class="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
      }
      <div class="relative flex flex-col items-center justify-center gap-3">
        <!-- SVG Spinner -->
        <svg class="animate-spin" [class]="spinnerSizeClass" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        @if (message) {
          <span class="text-sm font-medium text-gray-600 animate-pulse">{{ message }}</span>
        }
      </div>
    </div>
  `
})
export class LoaderComponent {
    @Input() fullScreen = false;
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() message?: string;

    get containerClass() {
        if (this.fullScreen) return 'flex items-center justify-center';
        return 'inline-flex items-center justify-center p-4 w-full';
    }

    get spinnerSizeClass() {
        switch (this.size) {
            case 'sm': return 'h-5 w-5 text-indigo-500';
            case 'lg': return 'h-12 w-12 text-indigo-600';
            default: return 'h-8 w-8 text-indigo-600';
        }
    }
}
