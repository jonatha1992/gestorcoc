import { Injectable, computed, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private pendingCount = signal(0);
    isLoading = computed(() => this.pendingCount() > 0);

    show(): void {
        this.pendingCount.update(n => n + 1);
    }

    hide(): void {
        this.pendingCount.update(n => Math.max(0, n - 1));
    }
}
