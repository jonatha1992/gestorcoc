import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

export type SupportedHashAlgorithm = 'sha256' | 'sha512' | 'sha3';

@Injectable({
    providedIn: 'root'
})
export class HashService {

    async hashFile(file: File, algorithm: SupportedHashAlgorithm): Promise<{ hash: string, time: number }> {
        const startTime = performance.now();
        const arrayBuffer = await file.arrayBuffer();
        const wordArray = this.arrayBufferToWordArray(arrayBuffer);

        let hash = '';
        if (algorithm === 'sha256') {
            hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex).toUpperCase();
        } else if (algorithm === 'sha512') {
            hash = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex).toUpperCase();
        } else {
            hash = CryptoJS.SHA3(wordArray, { outputLength: 256 }).toString(CryptoJS.enc.Hex).toUpperCase();
        }

        const endTime = performance.now();
        return {
            hash,
            time: Math.round(endTime - startTime)
        };
    }

    private arrayBufferToWordArray(ab: ArrayBuffer): CryptoJS.lib.WordArray {
        const i8a = new Uint8Array(ab);
        const a = [];
        for (let i = 0; i < i8a.length; i += 4) {
            a.push((i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]);
        }
        return CryptoJS.lib.WordArray.create(a, i8a.length);
    }
}
