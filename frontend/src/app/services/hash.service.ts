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
        const words: number[] = [];
        // Procesa grupos completos de 4 bytes
        const fullWords = Math.floor(i8a.length / 4);
        for (let i = 0; i < fullWords; i++) {
            const offset = i * 4;
            words.push(
                ((i8a[offset] << 24) |
                    (i8a[offset + 1] << 16) |
                    (i8a[offset + 2] << 8) |
                    i8a[offset + 3]) >>> 0
            );
        }
        // Maneja los bytes residuales (cuando length no es múltiplo de 4)
        const remainder = i8a.length % 4;
        if (remainder > 0) {
            let lastWord = 0;
            const base = fullWords * 4;
            for (let j = 0; j < remainder; j++) {
                lastWord |= (i8a[base + j] << (24 - j * 8));
            }
            words.push(lastWord >>> 0);
        }
        // El segundo argumento es el sigBytes (tamaño real en bytes, no en words)
        return CryptoJS.lib.WordArray.create(words as any, i8a.length);
    }
}
