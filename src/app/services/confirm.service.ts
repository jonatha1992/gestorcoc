import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmService {
    private stateSignal = signal<{ options: ConfirmOptions; resolve: (val: boolean) => void } | null>(null);
    state = this.stateSignal.asReadonly();

    ask(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            this.stateSignal.set({ options, resolve });
        });
    }

    confirm() {
        const state = this.stateSignal();
        if (state) {
            state.resolve(true);
            this.stateSignal.set(null);
        }
    }

    cancel() {
        const state = this.stateSignal();
        if (state) {
            state.resolve(false);
            this.stateSignal.set(null);
        }
    }
}
