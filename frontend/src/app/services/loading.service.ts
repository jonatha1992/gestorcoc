import { Injectable, signal, computed } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private requestCount = signal(0);
    isLoading = computed(() => this.requestCount() > 0);

    show() {
        this.requestCount.update(count => count + 1);
    }

    hide() {
        this.requestCount.update(count => Math.max(0, count - 1));
    }

    /** Force reset the counter (useful for error recovery) */
    reset() {
        this.requestCount.set(0);
    }
}
