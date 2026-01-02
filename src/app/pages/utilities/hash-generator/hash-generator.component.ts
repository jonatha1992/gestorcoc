import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HashService, FileHashResult, HashProgress } from '../../../services/hash.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hash-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8 relative z-10">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2 filter drop-shadow-sm">
          Generador de Hashes
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Verifica la integridad de tus archivos con precisión criptográfica. Soporte para archivos masivos.
        </p>
      </div>

      <!-- Settings Panel -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 dark:border-gray-700/50">
        <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Algoritmos Activos</h3>
        <div class="flex flex-wrap gap-4">
          <label class="group relative flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
            <input type="checkbox" [(ngModel)]="algos['md5']" class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300">
            <span class="ml-3 font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">MD5</span>
          </label>
          <label class="group relative flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
            <input type="checkbox" [(ngModel)]="algos['sha1']" class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300">
            <span class="ml-3 font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">SHA-1</span>
          </label>
          <label class="group relative flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
            <input type="checkbox" [(ngModel)]="algos['sha256']" class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300">
            <span class="ml-3 font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">SHA-256</span>
          </label>
          <label class="group relative flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
            <input type="checkbox" [(ngModel)]="algos['sha512']" class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300">
            <span class="ml-3 font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">SHA-512</span>
          </label>
        </div>
      </div>

      <!-- Drop Zone -->
      <div 
        class="relative overflow-hidden group border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer mb-10"
        [ngClass]="{
          'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20': isDragging,
          'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800': !isDragging
        }"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input #fileInput type="file" multiple class="hidden" (change)="onFileSelected($event)">
        
        <div class="relative z-10 transition-transform duration-300 group-hover:scale-105">
          <div class="mx-auto w-20 h-20 mb-6 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-all">
            <span class="text-4xl">📂</span>
          </div>
          <p class="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
            Arrastra archivos aquí
          </p>
          <p class="text-gray-500 dark:text-gray-400 font-medium">
            o haz clic para explorar tus carpetas
          </p>
        </div>

        <!-- Background Decor -->
        <div class="absolute inset-0 bg-gradient-to-br from-transparent to-indigo-500/5 dark:to-indigo-500/10 pointer-events-none"></div>
      </div>

      <!-- Toolbar -->
      <div class="flex justify-between items-center mb-6" *ngIf="results.length > 0">
        <div class="flex items-center space-x-2">
           <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wide">
             Resultados
           </span>
           <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ results.length }} archivo(s)</span>
        </div>
        <button (click)="clearResults()" class="group bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-4 py-2 rounded-lg shadow-sm transition-all text-sm font-semibold flex items-center gap-2">
          <span class="group-hover:rotate-12 transition-transform">🗑️</span> Limpiar
        </button>
      </div>

      <!-- Results Table -->
      <div class="overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700" *ngIf="results.length > 0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider">Archivo</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider text-right">Tamaño</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider" *ngIf="algos['md5']">MD5</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider" *ngIf="algos['sha1']">SHA-1</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider" *ngIf="algos['sha256']">SHA-256</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider" *ngIf="algos['sha512']">SHA-512</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let result of results" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <!-- File Name & Progress -->
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white relative">
                  <div class="flex flex-col z-10 relative">
                    <span class="truncate max-w-[250px]" [title]="result.fileName">{{ result.fileName }}</span>
                    <!-- Progress Bar -->
                    <div *ngIf="result.isLoading" class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-2 overflow-hidden">
                      <div class="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" [style.width.%]="result.progress"></div>
                    </div>
                    <span *ngIf="result.isLoading" class="text-[10px] uppercase font-bold text-indigo-500 mt-1 animate-pulse">Procesando {{ result.progress }}%</span>
                  </div>
                </td>
                
                <td class="px-6 py-4 text-right font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ formatBytes(result.fileSize) }}
                </td>

                <!-- Hash Columns -->
                <ng-container *ngFor="let algo of ['md5', 'sha1', 'sha256', 'sha512']">
                  <td class="px-6 py-4 font-mono text-xs" *ngIf="algos[algo]">
                    <ng-container *ngIf="!result.isLoading && getHash(result, algo); else loadingCell">
                       <div class="relative group/copy cursor-pointer" (click)="copyToClipboard(getHash(result, algo)!)">
                          <div class="truncate max-w-[120px] text-gray-600 dark:text-gray-300 group-hover/copy:text-indigo-600 dark:group-hover/copy:text-indigo-400 transition-colors" [title]="getHash(result, algo)">
                            {{ getHash(result, algo) }}
                          </div>
                          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/copy:opacity-100 bg-white/90 dark:bg-gray-800/90 backdrop-blur-[1px] transition-all">
                             <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded shadow-sm border border-indigo-100">COPIAR</span>
                          </div>
                       </div>
                    </ng-container>
                  </td>
                </ng-container>

                <ng-template #loadingCell>
                  <div class="animate-pulse h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-12" *ngIf="result.isLoading"></div>
                  <span *ngIf="!result.isLoading" class="text-gray-300 dark:text-gray-600">-</span>
                </ng-template>

              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    /* Custom Scrollbar for results table */
    .overflow-x-auto::-webkit-scrollbar {
      height: 8px;
    }
    .overflow-x-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 4px;
    }
    .dark .overflow-x-auto::-webkit-scrollbar-thumb {
      background-color: rgba(75, 85, 99, 0.5);
    }
  `]
})
export class HashGeneratorComponent {
  algos: { [key: string]: boolean } = {
    md5: true,
    sha1: false,
    sha256: true,
    sha512: false
  };

  results: UiHashResult[] = [];
  isDragging = false;

  constructor(private hashService: HashService) { }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
    }
    input.value = ''; // Reset input to allow selecting same file again
  }

  processFiles(files: FileList) {
    const selectedAlgos = Object.entries(this.algos)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);

    Array.from(files).forEach(file => {
      // Create UI entry immediately
      const uiResult: UiHashResult = {
        fileName: file.name,
        fileSize: file.size,
        isLoading: true,
        progress: 0,
        hashes: undefined
      };
      this.results.unshift(uiResult); // Add to top

      this.hashService.hashFile(file, selectedAlgos).subscribe({
        next: (event: any) => {
          if (event.percent !== undefined) {
            // Progress event
            uiResult.progress = event.percent;
          } else {
            // Final result
            uiResult.isLoading = false;
            uiResult.hashes = event;
            uiResult.progress = 100;
          }
        },
        error: (err) => {
          console.error('Error hashing file:', err);
          uiResult.isLoading = false;
          // Could add error state to UI here
        }
      });
    });
  }

  getHash(result: UiHashResult, algo: string): string | undefined {
    if (!result.hashes) return undefined;
    return (result.hashes as any)[algo];
  }

  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Toast
    });
  }

  clearResults() {
    this.results = [];
  }
}

interface UiHashResult {
  fileName: string;
  fileSize: number;
  isLoading: boolean;
  progress: number;
  hashes?: FileHashResult;
}
