import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'loading';
}

export interface ToastOptions {
    durationMs?: number;
    persist?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);
    private counter = 0;
    private timeoutMap = new Map<number, ReturnType<typeof setTimeout>>();

    show(
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' | 'loading' = 'info',
        options: ToastOptions = {}
    ): number {
        const { durationMs = 3500, persist = false } = options;
        const id = this.counter++;
        const newToast: Toast = { id, message, type };
        this.toasts.update(current => [...current, newToast]);

        if (!persist && durationMs > 0) {
            const timerId = setTimeout(() => {
                this.remove(id);
            }, durationMs);
            this.timeoutMap.set(id, timerId);
        }

        return id;
    }

    success(message: string, durationMs = 3200) {
        return this.show(message, 'success', { durationMs });
    }

    error(message: string, durationMs = 4200) {
        return this.show(message, 'error', { durationMs });
    }

    info(message: string, durationMs = 3200) {
        return this.show(message, 'info', { durationMs });
    }

    warning(message: string, durationMs = 3800) {
        return this.show(message, 'warning', { durationMs });
    }

    loading(message: string) {
        return this.show(message, 'loading', { persist: true });
    }

    update(id: number, patch: Partial<Omit<Toast, 'id'>>): void {
        this.toasts.update(current =>
            current.map(toast => (toast.id === id ? { ...toast, ...patch } : toast))
        );
    }

    remove(id: number) {
        const timerId = this.timeoutMap.get(id);
        if (timerId) {
            clearTimeout(timerId);
            this.timeoutMap.delete(id);
        }
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
