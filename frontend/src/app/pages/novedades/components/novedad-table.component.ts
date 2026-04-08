import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NovedadViewModel, getSeverityLabel, getNovedadTypeLabel } from '../utils/novedad-normalizers';

@Component({
  selector: 'app-novedad-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Activo Afectado</th>
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket COC</th>
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Gravedad</th>
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
              <th class="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (isLoading) {
            <tr>
              <td colspan="7" class="px-6 py-10 text-center">
                <div class="inline-flex items-center gap-3 text-slate-500 text-sm">
                  <span class="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></span>
                  Cargando novedades...
                </div>
              </td>
            </tr>
            } @else {
            @for (novedad of novedades; track novedad.id) {
            <tr class="hover:bg-slate-100/80 transition-colors">
              <td class="px-4 py-3 text-sm text-slate-500 font-medium whitespace-nowrap">
                {{ novedad.created_at | date:'dd/MM/yyyy HH:mm' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-700">
                    {{ novedad.assetLabel }}
                  </span>
                  <span class="text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-wider">
                    {{ getNovedadTypeLabel(novedad) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                @if (novedad.coc_ticket_number) {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ novedad.coc_ticket_number }}
                </span>
                } @else {
                <span class="text-xs text-slate-400 italic">Sin ticket</span>
                }
              </td>
              <td class="px-4 py-3">
                <span [ngClass]="{
                  'bg-rose-100 text-rose-700': novedad.severity === 'CRITICAL' || novedad.severity === 'HIGH',
                  'bg-amber-100 text-amber-700': novedad.severity === 'MEDIUM',
                  'bg-emerald-100 text-emerald-700': novedad.severity === 'LOW'
                }" class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                  {{ getSeverityLabel(novedad.severity) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 max-w-md truncate" [title]="novedad.description">
                {{ novedad.description }}
              </td>
              <td class="px-4 py-3">
                <span [ngClass]="{
                  'bg-emerald-100 text-emerald-700': novedad.status === 'CLOSED',
                  'bg-blue-100 text-blue-700': novedad.status === 'IN_PROGRESS',
                  'bg-slate-100 text-slate-700': novedad.status === 'OPEN'
                }" class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                  {{ getStatusLabel(novedad.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <button (click)="actaClick.emit(novedad)" 
                    class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" 
                    title="Generar Acta">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button (click)="emailClick.emit(novedad)" 
                    class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" 
                    title="Enviar por email">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button (click)="editClick.emit(novedad)" *ngIf="canEdit"
                    class="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" 
                    title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button (click)="deleteClick.emit(novedad.id)" *ngIf="canDelete"
                    class="p-1.5 hover:bg-rose-50 rounded-lg transition-colors" 
                    title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            } @empty {
            <tr>
              <td colspan="6" class="px-6 py-10 text-center text-slate-500 text-sm">
                No se encontraron novedades con los filtros seleccionados
              </td>
            </tr>
            }
            }
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      @if (totalCount > 0 && !isLoading) {
      <div class="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
        <div class="text-xs text-slate-500">
          Mostrando {{ novedades.length }} de {{ totalCount }} resultados
        </div>
        <div class="flex items-center gap-1">
          <button (click)="previousPage.emit()" 
            [disabled]="currentPage === 1"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Anterior
          </button>
          @for (page of pageNumbers; track page) {
            @if (page === -1) {
              <span class="px-2 py-1 text-slate-400">...</span>
            } @else {
              <button (click)="pageClick.emit(page)"
                [class.bg-indigo-600]="page === currentPage"
                [class.text-white]="page === currentPage"
                [class.hover:bg-indigo-700]="page === currentPage"
                [class.bg-white]="page !== currentPage"
                [class.text-slate-700]="page !== currentPage"
                [class.border]="page !== currentPage"
                [class.border-slate-200]="page !== currentPage"
                [class.hover:bg-slate-50]="page !== currentPage"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-w-[36px]">
                {{ page }}
              </button>
            }
          }
          <button (click)="nextPage.emit()" 
            [disabled]="currentPage === totalPages"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Siguiente
          </button>
        </div>
      </div>
      }
    </div>
  `,
})
export class NovedadTableComponent {
  @Input() novedades: NovedadViewModel[] = [];
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalCount = 0;
  @Input() pageSize = 50;
  @Input() canEdit = false;
  @Input() canDelete = false;

  @Output() editClick = new EventEmitter<NovedadViewModel>();
  @Output() deleteClick = new EventEmitter<number>();
  @Output() actaClick = new EventEmitter<NovedadViewModel>();
  @Output() emailClick = new EventEmitter<NovedadViewModel>();
  @Output() pageClick = new EventEmitter<number>();
  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const current = this.currentPage;
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  getSeverityLabel = getSeverityLabel;
  getNovedadTypeLabel = getNovedadTypeLabel;

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierta',
      IN_PROGRESS: 'En Progreso',
      CLOSED: 'Cerrada',
    };
    return map[status] || status;
  }
}
