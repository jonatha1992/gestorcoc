import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root'
})
export class HashService {

    async hashFile(file: File): Promise<{ md5: string, sha1: string, sha256: string, sha512: string, time: number }> {
        const startTime = performance.now();
        const arrayBuffer = await file.arrayBuffer();
        const wordArray = this.arrayBufferToWordArray(arrayBuffer);

        const result = {
            md5: CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex).toUpperCase(),
            sha1: CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex).toUpperCase(),
            sha256: CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex).toUpperCase(),
            sha512: CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex).toUpperCase(),
            time: 0
        };

        const endTime = performance.now();
        result.time = Math.round(endTime - startTime);

        return result;
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
