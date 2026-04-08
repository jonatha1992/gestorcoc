import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmModalOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    showWarning?: boolean;
    warningText?: string;
    confirmButtonClass?: string;
}

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (visible) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-30 backdrop-blur-[2px]"
             (click)="onCancel()">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all animate-fade-in"
                 (click)="$event.stopPropagation()">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div class="flex items-center gap-3">
                        <div [class]="getIconBgClass()">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                @if (effectiveOptions.showWarning) {
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                } @else {
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                }
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800">{{ effectiveOptions.title }}</h3>
                    </div>
                </div>

                <!-- Body -->
                <div class="px-6 py-5">
                    <p class="text-sm text-slate-600 leading-relaxed">{{ effectiveOptions.message }}</p>

                    @if (effectiveOptions.showWarning && effectiveOptions.warningText) {
                    <div class="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <p class="text-xs text-rose-700 font-medium">{{ effectiveOptions.warningText }}</p>
                    </div>
                    }
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button (click)="onCancel()"
                        class="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
                        {{ effectiveOptions.cancelText || 'Cancelar' }}
                    </button>
                    <button (click)="onConfirm()"
                        [class]="getConfirmButtonClass()"
                        class="px-4 py-2 border shadow-sm text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
                        {{ effectiveOptions.confirmText || 'Eliminar' }}
                    </button>
                </div>
            </div>
        </div>
        }
    `,
    styles: [`
        @keyframes fade-in {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out;
        }
    `]
})
export class ConfirmModalComponent {
    @Input() visible = false;
    @Input() options?: ConfirmModalOptions;
    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    get defaultOptions(): ConfirmModalOptions {
        return {
            title: 'Confirmar',
            message: '¿Está seguro?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            showWarning: false,
            warningText: '',
            confirmButtonClass: 'text-white bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
        };
    }

    get effectiveOptions(): ConfirmModalOptions {
        return this.options || this.defaultOptions;
    }

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    getIconBgClass(): string {
        if (this.effectiveOptions.showWarning) {
            return 'w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600';
        }
        return 'w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600';
    }

    getConfirmButtonClass(): string {
        return this.effectiveOptions.confirmButtonClass || 'text-white bg-rose-600 hover:bg-rose-700 focus:ring-rose-500';
    }
}
