import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { Observable } from 'rxjs';

export interface HashProgress {
    fileName: string;
    percent: number;
}

export interface FileHashResult {
    fileName: string;
    fileSize: number;
    md5?: string;
    sha1?: string;
    sha256?: string;
    sha512?: string;
}

@Injectable({
    providedIn: 'root'
})
export class HashService {

    constructor() { }

    /**
     * Hashes a file using the selected algorithms.
     * Emits progress updates and finally the result.
     */
    hashFile(file: File, selectedAlgos: string[] = ['md5', 'sha1', 'sha256']): Observable<HashProgress | FileHashResult> {
        return new Observable(observer => {
            const chunkSize = 2 * 1024 * 1024; // 2MB chunks
            const totalSize = file.size;
            let offset = 0;

            // Initialize selected algorithms
            const algos: { [key: string]: any } = {};
            if (selectedAlgos.includes('md5')) algos['md5'] = CryptoJS.algo.MD5.create();
            if (selectedAlgos.includes('sha1')) algos['sha1'] = CryptoJS.algo.SHA1.create();
            if (selectedAlgos.includes('sha256')) algos['sha256'] = CryptoJS.algo.SHA256.create();
            if (selectedAlgos.includes('sha512')) algos['sha512'] = CryptoJS.algo.SHA512.create();

            const reader = new FileReader();

            reader.onload = (e: any) => {
                const arrayBuffer = e.target.result;
                const wordArray = this.arrayBufferToWordArray(arrayBuffer);

                // Update all selected algorithms with this chunk
                for (const key in algos) {
                    algos[key].update(wordArray);
                }

                offset += arrayBuffer.byteLength;
                const percent = Math.min(100, Math.round((offset / totalSize) * 100));

                // Emit progress
                observer.next({ fileName: file.name, percent: percent } as HashProgress);

                if (offset < totalSize) {
                    // Read next chunk
                    readNextChunk();
                } else {
                    // Finalize
                    const result: FileHashResult = {
                        fileName: file.name,
                        fileSize: totalSize
                    };

                    if (algos['md5']) result.md5 = algos['md5'].finalize().toString();
                    if (algos['sha1']) result.sha1 = algos['sha1'].finalize().toString();
                    if (algos['sha256']) result.sha256 = algos['sha256'].finalize().toString();
                    if (algos['sha512']) result.sha512 = algos['sha512'].finalize().toString();

                    observer.next(result);
                    observer.complete();
                }
            };

            reader.onerror = (err) => {
                console.error('File Read Error', err);
                observer.error(err);
            };

            const readNextChunk = () => {
                const slice = file.slice(offset, offset + chunkSize);
                reader.readAsArrayBuffer(slice);
            };

            // Start reading
            readNextChunk();
        });
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
