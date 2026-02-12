import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashService } from '../services/hash.service';
import { ToastService } from '../services/toast.service';
import { RecordsService } from '../services/records.service';

interface FileHash {
  name: string;
  path: string; // Simulated path (usually just name unless directory upload)
  type: string;
  size: number;
  time: number;
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
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
          <select [(ngModel)]="selectedAlgorithm" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
             <option value="all">Todos los algoritmos</option>
             <option value="md5">Solo MD5</option>
             <option value="sha256">Solo SHA-256</option>
          </select>
          <button (click)="clearAll()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors uppercase">
            Limpiar Todo
          </button>
        </div>
      </div>

      <!-- Drop Zone -->
      <div 
        (dragover)="$event.preventDefault(); isOver = true"
        (dragleave)="isOver = false"
        (drop)="onFileDrop($event)"
        [class.border-indigo-500]="isOver"
        [class.bg-indigo-50]="isOver"
        class="relative border-2 border-dashed border-slate-200 rounded-3xl p-8 transition-all text-center group cursor-pointer hover:border-indigo-400 hover:bg-slate-50"
      >
        <input type="file" (change)="onFileSelect($event)" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
        
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p class="text-base font-bold text-slate-800">Arrastra archivos aquí</p>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filename</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Full Path (Simulated)</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Extension</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Size</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Time (ms)</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">MD5</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">SHA-1</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">SHA-256</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">SHA-512</th>
                <th class="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              @for (item of files(); track item.name) {
                <tr class="hover:bg-slate-50 transition-colors group">
                  <td class="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">{{ item.name }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap max-w-xs truncate">{{ item.path }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap">{{ item.type }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap font-mono">{{ formatSize(item.size) }}</td>
                  <td class="px-4 py-2 text-slate-500 whitespace-nowrap font-mono">{{ item.time }} ms</td>
                  
                  <td class="px-4 py-2 whitespace-nowrap">
                    @if (item.md5) { <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono select-all">{{ item.md5 }}</code> }
                    @else { <span class="animate-pulse w-8 h-2 bg-slate-200 block rounded"></span> }
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    @if (item.sha1) { <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono select-all">{{ item.sha1 }}</code> }
                    @else { <span class="animate-pulse w-8 h-2 bg-slate-200 block rounded"></span> }
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    @if (item.sha256) { <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono select-all">{{ item.sha256.substring(0, 10) }}...</code> }
                    @else { <span class="animate-pulse w-8 h-2 bg-slate-200 block rounded"></span> }
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    @if (item.sha512) { <code class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono select-all">{{ item.sha512.substring(0, 10) }}...</code> }
                    @else { <span class="animate-pulse w-8 h-2 bg-slate-200 block rounded"></span> }
                  </td>

                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex gap-2">
                        <button (click)="copyAll(item)" class="text-indigo-600 hover:text-indigo-800 font-medium text-xs uppercase" title="Copiar datos"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                        <button (click)="generateReport(item)" class="text-rose-600 hover:text-rose-800 font-medium text-xs uppercase" title="Descargar PDF"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></button>
                    </div>
                  </td>
                </tr>
              }
              @if (files().length === 0) {
                <tr>
                  <td colspan="10" class="px-6 py-12 text-center text-slate-400 italic">
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

  selectedAlgorithm = signal<string>('all');

  files = signal<FileHash[]>([]);
  isOver = false;

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isOver = false;
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(files);
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) this.processFiles(files);
  }

  async processFiles(fileList: FileList) {
    const newFiles: FileHash[] = Array.from(fileList).map(file => ({
      name: file.name,
      path: `C:\\FakePath\\Downloads\\${file.name}`, // Browser doesn't give real path
      type: file.name.split('.').pop() || 'Unknown',
      size: file.size,
      time: 0,
      md5: '',
      sha1: '',
      sha256: '',
      sha512: '',
      status: 'processing',
      fileObject: file
    }));

    this.files.update(current => [...newFiles, ...current]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const result = await this.hashService.hashFile(file);
        this.files.update(current =>
          current.map(f => f.name === file.name && f.status === 'processing'
            ? { ...f, ...result, status: 'done' }
            : f
          )
        );
      } catch (error) {
        console.error('Error hashing file:', error);
        this.toastService.error(`Error al procesar ${file.name}`);
      }
    }
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

  copyAll(item: FileHash) {
    const text = `Filename: ${item.name}
Full Path: ${item.path}
Size: ${this.formatSize(item.size)}
Time: ${item.time}ms
MD5: ${item.md5}
SHA-1: ${item.sha1}
SHA-256: ${item.sha256}
SHA-512: ${item.sha512}`;
    navigator.clipboard.writeText(text);
    this.toastService.success('Datos copiados');
  }

  generateReport(item: FileHash) {
    this.toastService.success('Generando reporte PDF...');
    this.recordsService.generateIntegrityReport(item.fileObject, this.selectedAlgorithm())
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `integrity_report_${item.name}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastService.success('Reporte descargado');
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Error al generar reporte');
        }
      });
  }
}
