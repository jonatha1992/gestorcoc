import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashService, SupportedHashAlgorithm } from '../../services/hash.service';
import { ToastService } from '../../services/toast.service';
import { RecordsService } from '../../services/records.service';

export interface ReportHashItem {
  name: string;
  algorithm: string;
  hash: string;
}

export interface FileHash {
  rowId: string;
  name: string;
  path: string;
  type: string;
  size: number;
  time: number;
  selectedAlgorithm: SupportedHashAlgorithm;
  selectedHash: string;
  status: 'pending' | 'processing' | 'done';
  fileObject?: File;
}

@Component({
  selector: 'app-hash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hash.component.html',
  providers: [HashService]
})
export class HashComponent {
  private hashService = inject(HashService);
  private toastService = inject(ToastService);
  private recordsService = inject(RecordsService);

  selectedAlgorithms = signal<SupportedHashAlgorithm[]>(['sha256']);
  files = signal<FileHash[]>([]);
  loadedReportItems = signal<ReportHashItem[]>([]);
  verifiedHashes = signal<Map<string, string>>(new Map());
  isOver = false;

  toggleAlgorithm(algo: SupportedHashAlgorithm) {
    const current = this.selectedAlgorithms();
    if (current.includes(algo)) {
      if (current.length > 1) {
        this.selectedAlgorithms.set(current.filter(a => a !== algo));
        this.clearAll();
      } else {
        this.toastService.error('Debe seleccionar al menos un algoritmo');
      }
    } else {
      this.selectedAlgorithms.set([...current, algo]);
      this.clearAll();
    }
  }

  isAlgorithmSelected(algo: SupportedHashAlgorithm): boolean {
    return this.selectedAlgorithms().includes(algo);
  }

  formatTime(ms: number): string {
    if (ms < 1000) return `${ms} ms`;
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) return `${(ms / 1000).toFixed(2)} s`;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;

    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m ${seconds}s`;
  }

  async onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isOver = false;

    const items = event.dataTransfer?.items;
    if (!items) return;

    const filesToProcess: File[] = [];

    // Función recursiva para procesar entradas (archivos o directorios)
    const traverseFileTree = async (item: FileSystemEntry, path: string = '') => {
      if (item.isFile) {
        const fileEntry = item as FileSystemFileEntry;
        await new Promise<void>((resolve) => {
          fileEntry.file((file) => {
            // Sobrescribimos temporalmente el webkitRelativePath inyectándolo como propiedad personalizada
            Object.defineProperty(file, 'customPath', {
              value: path + file.name,
              writable: false
            });
            filesToProcess.push(file);
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirEntry = item as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          // Leer todas las entradas en este directorio
          // readEntries no siempre retorna todos, pero para fines prácticos suele bastar en llamadas iniciales si no hay miles.
          // Para ser exhaustivos se debería llamar iterativamente hasta que devuelva array vacío.
          const readAll = async () => {
            let allEntries: FileSystemEntry[] = [];
            let result: FileSystemEntry[];
            do {
              result = await new Promise<FileSystemEntry[]>((res) => dirReader.readEntries(res));
              allEntries = allEntries.concat(result);
            } while (result.length > 0);
            return allEntries;
          };
          readAll().then(resolve);
        });

        for (const entry of entries) {
          await traverseFileTree(entry, path + dirEntry.name + '/');
        }
      }
    };

    // Procesar los items soltados en el contenedor superior
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseFileTree(entry);
        }
      }
    }

    if (filesToProcess.length > 0) {
      this.processFiles(filesToProcess);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;
    if (selectedFiles?.length) this.processFiles(Array.from(selectedFiles));
    input.value = '';
  }

  async processFiles(fileList: File[] | FileList) {
    const algorithmsToUse = this.selectedAlgorithms();
    const filesArray = Array.from(fileList);

    // Crear una fila por CADA archivo y por CADA algoritmo seleccionado
    const newFiles: FileHash[] = [];

    for (const file of filesArray) {
      for (const algo of algorithmsToUse) {
        const customPath = (file as any).customPath || (file.webkitRelativePath || file.name);

        newFiles.push({
          rowId: this.createRowId(),
          name: file.name,
          path: `C: \\FakePath\\Downloads\\${customPath}`,
          type: file.name.split('.').pop() || 'Unknown',
          size: file.size,
          time: 0,
          selectedAlgorithm: algo,
          selectedHash: '',
          status: 'processing',
          fileObject: file
        });
      }
    }

    this.files.update(current => [...newFiles, ...current]);

    // Procesar concurrentemente (un hash a la vez por CPU no es posible directamente sin WebWorkers en el fondo,
    // pero el event loop sigue interrumpiéndose debido a que CryptoJS funciona bloqueante).
    // Evitamos congelamientos extremos al no usar un simple iterador mapeando asíncronamente.
    await Promise.all(
      newFiles.map(async (row) => {
        if (!row.fileObject) return; // Salvaguarda extra
        try {
          const result = await this.hashService.hashFile(row.fileObject!, row.selectedAlgorithm);
          this.files.update(current =>
            current.map(f => f.rowId === row.rowId
              ? { ...f, selectedHash: result.hash, time: result.time, status: 'done' }
              : f
            )
          );
        } catch (error) {
          console.error('Error hashing file:', error);
          this.toastService.error(`Error al procesar ${row.name}`);
        }
      })
    );
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
    this.verifiedHashes.set(new Map());
    this.loadedReportItems.set([]);
  }

  onReportSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const html = e.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const rows = doc.querySelectorAll('table tbody tr');

      const verificationMap = new Map<string, string>();
      const importedFiles: ReportHashItem[] = [];
      let parsedCount = 0;

      rows.forEach(row => {
        const tdName = row.children[1];
        let tdAlgorithm: Element | null = null;
        let tdHash: Element | null = null;

        // Soporte para reporte antiguo (6 columnas) y el nuevo (7 columnas)
        if (row.children.length === 6) {
          tdAlgorithm = row.children[2];
          tdHash = row.children[5];
        } else if (row.children.length >= 7) {
          tdAlgorithm = row.children[4];
          tdHash = row.children[6];
        }

        if (tdName && tdHash && tdAlgorithm) {
          const name = tdName.textContent?.trim();
          const hash = tdHash.textContent?.trim();
          const algorithmRaw = tdAlgorithm.textContent?.trim() || '';

          if (name && hash) {
            verificationMap.set(name, hash);
            parsedCount++;

            importedFiles.push({
              name,
              algorithm: algorithmRaw,
              hash
            });
          }
        }
      });

      if (parsedCount > 0) {
        this.verifiedHashes.set(verificationMap);
        this.loadedReportItems.set(importedFiles);
        this.toastService.success(`Reporte base cargado: ${parsedCount} hashes para auditar`);
      } else {
        this.toastService.error('No se encontraron hashes en el reporte o el formato es inválido');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  deleteRow(item: FileHash) {
    this.files.update(current => current.filter(f => f.rowId !== item.rowId));
    this.toastService.success('Hash eliminado de la tabla');
  }

  copyAll(item: FileHash) {
    const text = `Filename: ${item.name}
Full Path: ${item.path}
Size: ${this.formatSize(item.size)}
Time: ${this.formatTime(item.time)}
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
        type: item.type,
        size_str: this.formatSize(item.size),
        size: item.size,
        algorithm: this.getAlgorithmLabel(item.selectedAlgorithm),
        hash: item.selectedHash,
        time_ms: this.formatTime(item.time).replace(' ms ms', ' ms')
      }));
    if (entries.length === 0) {
      this.toastService.error('No hay hashes listos para exportar');
      return;
    }

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

  downloadHtmlReport() {
    const items = this.files().filter(f => f.status === 'done' && !!f.selectedHash);
    if (items.length === 0) {
      this.toastService.error('No hay hashes listos para exportar');
      return;
    }

    const now = new Date().toLocaleString('es-AR');
    let rows = '';
    items.forEach((item, i) => {
      // Limpiar tiempo si tiene duplicado ms
      const timeFmt = this.formatTime(item.time).replace(' ms ms', ' ms');
      rows += `
<tr>
  <td>${i + 1}</td>
  <td>${this.escapeHtml(item.name)}</td>
  <td>${this.escapeHtml(item.type)}</td>
  <td>${this.formatSize(item.size)}</td>
  <td>${this.getAlgorithmLabel(item.selectedAlgorithm)}</td>
  <td>${timeFmt}</td>
  <td class="hash">${this.escapeHtml(item.selectedHash)}</td>
</tr>`;
    });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Integridad</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { padding: 20px; color: #1e293b; }
    h1 { font-size: 20px; margin-bottom: 4px; color: #1e3a5f; }
    .meta { font-size: 11px; color: #64748b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1e3a5f; color: #fff; padding: 7px 8px; text-align: left; white-space: nowrap; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    td.hash { font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all; color: #3730a3; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 16px; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Reporte de Integridad de Archivos</h1>
  <p class="meta">Generado el: ${now} &nbsp;&bull;&nbsp; Total archivos: ${items.length}</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Nombre</th><th>Tipo</th><th>Tamaño</th><th>Algoritmo</th><th>Tiempo</th><th>Hash Completo</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Generado por GestorCOC &mdash; Este documento es un resumen de integridad generado automáticamente.</p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `integrity_report_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
    this.toastService.success('Reporte HTML descargado');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private createRowId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
