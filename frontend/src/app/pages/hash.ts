import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashService, SupportedHashAlgorithm } from '../services/hash.service';
import { ToastService } from '../services/toast.service';
import { RecordsService } from '../services/records.service';

interface FileHash {
  rowId: string;
  name: string;
  path: string;
  type: string;
  size: number;
  time: number;
  selectedAlgorithm: SupportedHashAlgorithm;
  selectedHash: string;
  status: 'pending' | 'processing' | 'done';
  fileObject: File;
}

@Component({
  selector: 'app-hash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-end">
        <div class="flex items-center gap-4">
          <select
            [ngModel]="selectedAlgorithm()"
            (ngModelChange)="onAlgorithmChange($event)"
            class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
             <option value="sha256">SHA-256</option>
             <option value="sha512">SHA-512</option>
             <option value="sha3">SHA-3</option>
          </select>
          <button (click)="clearAll()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors uppercase">
            Limpiar Todo
          </button>
          <button (click)="downloadSummaryReport()" [disabled]="files().length === 0" class="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg transition-colors uppercase">
            Descargar PDF (Todo)
          </button>
        </div>
      </div>

      <div
        (dragover)="$event.preventDefault(); isOver = true"
        (dragleave)="isOver = false"
        (drop)="onFileDrop($event)"
        [class.border-indigo-500]="isOver"
        [class.bg-indigo-50]="isOver"
        class="relative border-2 border-dashed border-slate-200 rounded-3xl p-8 transition-all text-center group cursor-pointer hover:border-indigo-400 hover:bg-slate-50"
      >
        <input #fileInput type="file" (change)="onFileSelect($event)" multiple class="hidden">

        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p class="text-base font-bold text-slate-800">Arrastra archivos aqui</p>
            <button
              type="button"
              (click)="fileInput.click(); $event.stopPropagation()"
              class="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Seleccionar archivos
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filename</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Full Path (Simulated)</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Extension</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Size</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Time (ms)</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Algoritmo</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Hash</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              @for (item of files(); track item.rowId) {
                <tr class="hover:bg-slate-50 transition-colors group">
                  <td class="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">{{ item.name }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap max-w-xs truncate">{{ item.path }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap">{{ item.type }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap font-mono">{{ formatSize(item.size) }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap font-mono">{{ item.time }} ms</td>
                  <td class="px-4 py-2 text-slate-700 whitespace-nowrap font-semibold">{{ getAlgorithmLabel(item.selectedAlgorithm) }}</td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    @if (item.selectedHash) {
                      <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono select-all">{{ item.selectedHash }}</code>
                    } @else {
                      <span class="animate-pulse w-8 h-2 bg-slate-200 block rounded"></span>
                    }
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex gap-2">
                      <button (click)="copyAll(item)" class="text-indigo-600 hover:text-indigo-800 font-medium text-xs uppercase" title="Copiar datos">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button (click)="deleteRow(item)" class="text-slate-500 hover:text-rose-700 font-medium text-xs uppercase" title="Elimina hash y reporte de la tabla">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (files().length === 0) {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-400 italic">
                    Esperando archivos...
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  providers: [HashService]
})
export class HashComponent {
  private hashService = inject(HashService);
  private toastService = inject(ToastService);
  private recordsService = inject(RecordsService);

  selectedAlgorithm = signal<SupportedHashAlgorithm>('sha256');
  files = signal<FileHash[]>([]);
  isOver = false;

  onAlgorithmChange(value: SupportedHashAlgorithm) {
    this.selectedAlgorithm.set(value);
    this.clearAll();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isOver = false;
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) this.processFiles(droppedFiles);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;
    if (selectedFiles?.length) this.processFiles(selectedFiles);
    input.value = '';
  }

  async processFiles(fileList: FileList) {
    const algorithm = this.selectedAlgorithm();
    const newFiles: FileHash[] = Array.from(fileList).map(file => ({
      rowId: this.createRowId(),
      name: file.name,
      path: `C:\\FakePath\\Downloads\\${file.name}`,
      type: file.name.split('.').pop() || 'Unknown',
      size: file.size,
      time: 0,
      selectedAlgorithm: algorithm,
      selectedHash: '',
      status: 'processing',
      fileObject: file
    }));

    this.files.update(current => [...newFiles, ...current]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const targetRowId = newFiles[i].rowId;
      try {
        const result = await this.hashService.hashFile(file, algorithm);
        this.files.update(current =>
          current.map(f => f.rowId === targetRowId
            ? { ...f, selectedHash: result.hash, time: result.time, status: 'done' }
            : f
          )
        );
      } catch (error) {
        console.error('Error hashing file:', error);
        this.toastService.error(`Error al procesar ${file.name}`);
      }
    }
  }

  getAlgorithmLabel(algorithm: SupportedHashAlgorithm): string {
    if (algorithm === 'sha256') return 'SHA-256';
    if (algorithm === 'sha512') return 'SHA-512';
    return 'SHA-3';
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  clearAll() {
    this.files.set([]);
  }

  deleteRow(item: FileHash) {
    this.files.update(current => current.filter(f => f.rowId !== item.rowId));
    this.toastService.success('Hash eliminado de la tabla');
  }

  copyAll(item: FileHash) {
    const text = `Filename: ${item.name}
Full Path: ${item.path}
Size: ${this.formatSize(item.size)}
Time: ${item.time}ms
Algorithm: ${this.getAlgorithmLabel(item.selectedAlgorithm)}
Hash: ${item.selectedHash}`;
    navigator.clipboard.writeText(text);
    this.toastService.success('Datos copiados');
  }

  downloadSummaryReport() {
    const entries = this.files()
      .filter(item => item.status === 'done' && !!item.selectedHash)
      .map(item => ({
      name: item.name,
      size: item.size,
      algorithm: this.getAlgorithmLabel(item.selectedAlgorithm),
      hash: item.selectedHash,
      time_ms: item.time
      }));
    if (entries.length === 0) {
      this.toastService.error('No hay hashes listos para exportar');
      return;
    }

    this.toastService.success('Generando PDF de todos los hashes...');
    this.recordsService.generateIntegritySummaryReport(entries)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'integrity_report_resumen.pdf';
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastService.success('Reporte descargado');
        },
        error: async (err) => {
          console.error(err);
          let message = 'Error al generar reporte';
          try {
            if (err?.error instanceof Blob) {
              const text = await err.error.text();
              const parsed = JSON.parse(text);
              if (parsed?.error) {
                message = parsed.error;
              }
            } else if (err?.error?.error) {
              message = err.error.error;
            }
          } catch {
            // keep default error message
          }
          this.toastService.error(message);
        }
      });
  }

  private createRowId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
