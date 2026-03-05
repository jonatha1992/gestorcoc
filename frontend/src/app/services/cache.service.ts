import { Injectable } from '@angular/core';
import { Observable, asyncScheduler, of } from 'rxjs';
import { observeOn, tap } from 'rxjs/operators';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export const TTL = {
    SHORT: 5 * 60 * 1000,   // 5 minutes
    MEDIUM: 15 * 60 * 1000, // 15 minutes
    LONG: 30 * 60 * 1000,   // 30 minutes
};

@Injectable({ providedIn: 'root' })
export class CacheService {
    private readonly PREFIX = 'gestorcoc_cache_';

    get<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(this.PREFIX + key);
            if (!raw) return null;
            const entry: CacheEntry<T> = JSON.parse(raw);
            if (Date.now() > entry.expiresAt) {
                localStorage.removeItem(this.PREFIX + key);
                return null;
            }
            return entry.data;
        } catch {
            return null;
        }
    }

    set<T>(key: string, data: T, ttlMs: number): void {
        try {
            const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
            localStorage.setItem(this.PREFIX + key, JSON.stringify(entry));
        } catch {
            // Storage quota exceeded or unavailable — skip caching silently
        }
    }

    invalidate(key: string): void {
        localStorage.removeItem(this.PREFIX + key);
    }

    /**
     * Returns cached data immediately if available and fresh,
     * otherwise fetches from source Observable and caches the result.
     */
    withCache<T>(key: string, ttlMs: number, source: Observable<T>): Observable<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return of(cached).pipe(observeOn(asyncScheduler));
        }
        return source.pipe(
            tap(data => this.set(key, data, ttlMs))
        );
    }
}
