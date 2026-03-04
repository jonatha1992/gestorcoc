import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

export type AesAlgorithm = 'AES-128' | 'AES-192' | 'AES-256';

@Injectable({
    providedIn: 'root'
})
export class EncryptionService {

    constructor() { }

    /**
     * Encrypts a File using AES.
     * Returns a Promise resolving to a Blob containing the encrypted data.
     */
    async encryptFile(file: File, password: string, algorithm: AesAlgorithm): Promise<Blob> {
        const arrayBuffer = await file.arrayBuffer();
        const word_array = CryptoJS.lib.WordArray.create(arrayBuffer as any);

        // Derive key and IV using PBKDF2
        const keySize = this.getKeySize(algorithm);
        const salt = CryptoJS.lib.WordArray.random(128 / 8);
        const iv = CryptoJS.lib.WordArray.random(128 / 8);

        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: keySize,
            iterations: 10000
        });

        const encrypted = CryptoJS.AES.encrypt(word_array, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        // We store the Salt (16 bytes), IV (16 bytes), and then the Ciphertext
        // so we can decrypt it later without needing the Salt/IV externally.
        const combined = salt.clone().concat(iv).concat(encrypted.ciphertext);

        // Convert WordArray back to Uint8Array
        const uint8Array = this.wordArrayToUint8Array(combined);
        return new Blob([uint8Array as any], { type: 'application/octet-stream' });
    }

    /**
     * Decrypts a File (which is actually a Blob we encrypted earlier) using AES.
     * Returns a Promise resolving to a Blob containing the decrypted data.
     */
    async decryptFile(file: File, password: string, algorithm: AesAlgorithm): Promise<Blob> {
        const arrayBuffer = await file.arrayBuffer();
        const word_array = CryptoJS.lib.WordArray.create(arrayBuffer as any);

        if (word_array.sigBytes < 32) {
            throw new Error('Archivo demasiado pequeño u corrupto');
        }

        // Extract Salt (16 bytes / 4 words) and IV (16 bytes / 4 words)
        const salt = CryptoJS.lib.WordArray.create(word_array.words.slice(0, 4), 16);
        const iv = CryptoJS.lib.WordArray.create(word_array.words.slice(4, 8), 16);

        // The rest is ciphertext
        const ciphertext = CryptoJS.lib.WordArray.create(
            word_array.words.slice(8),
            word_array.sigBytes - 32
        );

        const keySize = this.getKeySize(algorithm);
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: keySize,
            iterations: 10000
        });

        // Create a cipher params object
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: ciphertext
        });

        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        const uint8Array = this.wordArrayToUint8Array(decrypted);
        return new Blob([uint8Array as any]);
    }

    private getKeySize(algorithm: AesAlgorithm): number {
        switch (algorithm) {
            case 'AES-128': return 128 / 32; // 4 words
            case 'AES-192': return 192 / 32; // 6 words
            case 'AES-256': return 256 / 32; // 8 words
            default: return 256 / 32;
        }
    }

    private wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
        const l = wordArray.sigBytes;
        const words = wordArray.words;
        const result = new Uint8Array(l);
        let i = 0, j = 0;
        while (true) {
            if (i === l) break;
            const w = words[j++];
            result[i++] = (w & 0xff000000) >>> 24;
            if (i === l) break;
            result[i++] = (w & 0x00ff0000) >>> 16;
            if (i === l) break;
            result[i++] = (w & 0x0000ff00) >>> 8;
            if (i === l) break;
            result[i++] = (w & 0x000000ff);
        }
        return result;
    }
}
