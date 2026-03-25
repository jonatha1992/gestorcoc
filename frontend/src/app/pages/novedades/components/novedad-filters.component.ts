import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getFirstDayOfCurrentMonthInputValue, getTodayDateInputValue } from '../../../utils/date-inputs';

export interface NovedadFilters {
  searchText: string;
  filterStatus: string;
  filterSeverity: string;
  filterIncidentType: string;
  filterAssetType: string;
  filterDateFrom: string;
  filterDateTo: string;
  filterReportedBy: string;
  filterTicketNumber: string;
}

@Component({
  selector: 'app-novedad-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
      <!-- Header con búsqueda y botón -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="relative w-full lg:w-80">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" 
            [(ngModel)]="localFilters.searchText" 
            (ngModelChange)="onSearchChange()"
            class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            placeholder="Buscar novedad...">
        </div>
        <div class="flex items-center justify-end">
          <button (click)="createClick.emit()" *ngIf="canCreate"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Novedad
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-2">
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha desde</label>
          <input type="date" lang="es-AR" [(ngModel)]="localFilters.filterDateFrom" (ngModelChange)="onFilterChange()" [attr.max]="maxDate"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600">
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha hasta</label>
          <input type="date" lang="es-AR" [(ngModel)]="localFilters.filterDateTo" (ngModelChange)="onFilterChange()" [attr.max]="maxDate"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600">
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo activo</label>
          <select [(ngModel)]="localFilters.filterAssetType" (ngModelChange)="onFilterChange()"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600">
            <option value="">Todos</option>
            <option value="CAMERA">Cámara</option>
            <option value="SERVER">Servidor</option>
            <option value="SYSTEM">Sistema</option>
            <option value="GEAR">Equipamiento</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severidad</label>
          <select [(ngModel)]="localFilters.filterSeverity" (ngModelChange)="onFilterChange()"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600">
            <option value="">Todas</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo incidente</label>
          <input type="text" [(ngModel)]="localFilters.filterIncidentType" (ngModelChange)="onFilterChange()"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600"
            placeholder="Ej: FALLA_TECNICA">
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reportado por</label>
          <input type="text" [(ngModel)]="localFilters.filterReportedBy" (ngModelChange)="onFilterChange()"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600"
            placeholder="Nombre responsable">
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ticket COC</label>
          <input type="text" [(ngModel)]="localFilters.filterTicketNumber" (ngModelChange)="onFilterChange()"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600"
            placeholder="Ej: TICK-2026">
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</label>
          <select [(ngModel)]="localFilters.filterStatus" (ngModelChange)="onFilterChange()"
            class="w-full min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-600">
            <option value="">Todos</option>
            <option value="OPEN">Abierta</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="CLOSED">Cerrada</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acciones</label>
          <button type="button" (click)="clearFilters()"
            class="w-full text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors">
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NovedadFiltersComponent {
  @Input() filters: NovedadFilters = {
    searchText: '',
    filterStatus: '',
    filterSeverity: '',
    filterIncidentType: '',
    filterAssetType: '',
    filterDateFrom: getFirstDayOfCurrentMonthInputValue(),
    filterDateTo: getTodayDateInputValue(),
    filterReportedBy: '',
    filterTicketNumber: '',
  };
  
  @Input() canCreate = false;
  
  @Output() filtersChange = new EventEmitter<NovedadFilters>();
  @Output() createClick = new EventEmitter<void>();

  localFilters: NovedadFilters = { ...this.filters };
  private searchTimer: any;

  get maxDate(): string {
    return getTodayDateInputValue();
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.filtersChange.emit({ ...this.localFilters });
    }, 400);
  }

  onFilterChange() {
    this.filtersChange.emit({ ...this.localFilters });
  }

  clearFilters() {
    this.localFilters = {
      searchText: '',
      filterStatus: '',
      filterSeverity: '',
      filterIncidentType: '',
      filterAssetType: '',
      filterDateFrom: getFirstDayOfCurrentMonthInputValue(),
      filterDateTo: getTodayDateInputValue(),
      filterReportedBy: '',
      filterTicketNumber: '',
    };
    this.filtersChange.emit(this.localFilters);
  }
}
