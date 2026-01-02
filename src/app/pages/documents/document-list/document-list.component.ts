import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService } from '../../../services/document.service';
import { DocumentModel, DocumentType } from '../../../models/document.model';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-400 mb-2 filter drop-shadow-sm">
            📂 Mesa de Entrada
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Gestión de expedientes y documentación oficial.
          </p>
        </div>
        <button (click)="navigateToNew()" 
          class="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-cyan-500/20 font-bold flex items-center gap-2 transition-all active:scale-95 group">
          <span class="text-xl group-hover:scale-110 transition-transform">📝</span> 
          <span>Nuevo Registro</span>
        </button>
      </div>

      <!-- Filters Panel -->
      <div class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 mb-8 relative overflow-hidden">
        <!-- Background Decor -->
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          
          <!-- Type Filter -->
          <div class="relative">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tipo de Movimiento</label>
            <div class="relative group">
               <select [(ngModel)]="filters.type" (change)="applyFilters()" 
                 class="w-full appearance-none bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all cursor-pointer shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700">
                 <option value="ALL">📋 Todos los movimientos</option>
                 <option value="ENTRADA">📥 Entrada</option>
                 <option value="SALIDA">📤 Salida</option>
               </select>
               <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>
          </div>

          <!-- Search -->
          <div class="md:col-span-3">
             <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Búsqueda Global</label>
             <div class="relative group">
               <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
               </span>
               <input type="text" [(ngModel)]="filters.searchTerm" (keyup)="applyFilters()" 
                 placeholder="Buscar por asunto, referencia, remitente o destinatario..." 
                 class="w-full pl-11 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all shadow-sm group-hover:border-cyan-300 dark:group-hover:border-cyan-700">
             </div>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider">Tipo</th>
                <th class="px-6 py-4 font-bold tracking-wider">Referencia</th>
                <th class="px-6 py-4 font-bold tracking-wider">Fecha</th>
                <th class="px-6 py-4 font-bold tracking-wider">Detalles</th>
                <th class="px-6 py-4 font-bold tracking-wider">Origen / Destino</th>
                <th class="px-6 py-4 font-bold tracking-wider">Estado</th>
                <th class="px-6 py-4 font-bold tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
              <tr *ngFor="let doc of filteredDocuments$ | async" class="hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors group">
                
                <!-- Type Badge -->
                <td class="px-6 py-4">
                  <span [class]="getTypeClass(doc.type)" class="px-3 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-sm shadow-sm">
                    {{ doc.type === 'ENTRADA' ? '📥 ENTRADA' : '📤 SALIDA' }}
                  </span>
                </td>

                <td class="px-6 py-4">
                  <span class="font-mono text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded select-all">
                    {{ doc.referenceNumber }}
                  </span>
                </td>

                <td class="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                  {{ doc.date.toDate() | date:'dd/MM/yyyy' }}
                </td>

                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-900 dark:text-white max-w-xs truncate" [title]="doc.subject">
                    {{ doc.subject }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-500 mt-0.5" *ngIf="doc.priority === 'ALTA'">
                    🔥 Prioridad Alta
                  </div>
                </td>

                <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                  <div class="flex flex-col text-xs">
                    <span *ngIf="doc.type === 'ENTRADA'" class="flex items-center gap-1">
                      <span class="text-gray-400">De:</span> 
                      <span class="font-bold border-b border-dashed border-gray-300 dark:border-gray-600">{{ doc.sender }}</span>
                    </span>
                    <span *ngIf="doc.type === 'SALIDA'" class="flex items-center gap-1">
                       <span class="text-gray-400">Para:</span>
                       <span class="font-bold border-b border-dashed border-gray-300 dark:border-gray-600">{{ doc.recipient }}</span>
                    </span>
                  </div>
                </td>

                <td class="px-6 py-4">
                   <span [class]="getStatusClass(doc.status)" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                     {{ doc.status.replace('_', ' ') }}
                   </span>
                </td>

                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors p-1.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg" title="Ver Detalles">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </button>
                    <button class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Editar">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                  </div>
                </td>

              </tr>
              
              <!-- Empty State -->
              <tr *ngIf="(filteredDocuments$ | async)?.length === 0">
                <td colspan="7" class="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center justify-center">
                    <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <span class="text-4xl">📭</span>
                    </div>
                    <p class="text-xl font-bold mb-2">No se encontraron documentos</p>
                    <p class="text-sm opacity-75 max-w-sm mx-auto">
                      Intenta ajustar los filtros de búsqueda o crea un nuevo registro para comenzar.
                    </p>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.5);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.7);
    }
  `]
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private router = inject(Router);

  documents$ = new BehaviorSubject<DocumentModel[]>([]);
  filteredDocuments$ = new BehaviorSubject<DocumentModel[]>([]);

  filters = {
    type: 'ALL',
    searchTerm: ''
  };

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.documentService.getDocuments().subscribe(docs => {
      this.documents$.next(docs);
      this.applyFilters();
    });
  }

  applyFilters() {
    let result = this.documents$.value;

    // Filter by Type
    if (this.filters.type !== 'ALL') {
      result = result.filter(d => d.type === this.filters.type);
    }

    // Filter by Search Term
    if (this.filters.searchTerm) {
      const term = this.filters.searchTerm.toLowerCase();
      result = result.filter(d =>
        d.subject.toLowerCase().includes(term) ||
        d.referenceNumber.toLowerCase().includes(term) ||
        d.sender.toLowerCase().includes(term) ||
        d.recipient.toLowerCase().includes(term)
      );
    }

    this.filteredDocuments$.next(result);
  }

  navigateToNew() {
    this.router.navigate(['/documents/new']);
  }

  getTypeClass(type: string): string {
    return type === 'ENTRADA'
      ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50'
      : 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200';
      case 'EN_PROCESO': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200';
      case 'FINALIZADO': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200';
      case 'ARCHIVADO': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
