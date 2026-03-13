import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HechosService, Hecho } from '../../services/hechos';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PermissionCodes } from '../../auth/auth.models';
import {
  getFirstDayOfCurrentMonthInputValue,
  getNowDateTimeLocalInputValue,
  getTodayDateInputValue,
  toDateTimeLocalInputValue,
} from '../../utils/date-inputs';

@Component({
  selector: 'app-hechos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './hechos.html',
  providers: [HechosService, AssetService],
})
export class HechosComponent implements OnInit {
  private hechosService = inject(HechosService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  hechos = signal<Hecho[]>([]);
  cameras = signal<any[]>([]);
  showForm = signal(false);

  // Pagination
  currentPage = 1;
  totalCount = 0;
  pageSize = 50;
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  // Filters
  searchText = '';
  filterCategory = '';
  filterSolved = '';
  filterCamera = '';
  filterCocIntervention = '';
  filterGeneratedCause = '';
  filterDateFrom = getFirstDayOfCurrentMonthInputValue();
  filterDateTo = getTodayDateInputValue();
  private searchTimer: any;

  currentHecho: Partial<Hecho> = {
    category: 'OPERATIVO',
    timestamp: getNowDateTimeLocalInputValue(),
  };

  get canManageHechos(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_HECHOS);
  }

  private requireManageHechos(): boolean {
    if (this.canManageHechos) {
      return true;
    }
    this.toastService.error('No tiene permiso para modificar hechos.');
    return false;
  }

  ngOnInit() {
    this.loadHechos();
    this.loadCameras();
  }

  loadHechos() {
    this.hechosService
      .getHechos(this.currentPage, {
        search: this.searchText || undefined,
        category: this.filterCategory || undefined,
        is_solved: this.filterSolved,
        camera: this.filterCamera || undefined,
        coc_intervention: this.filterCocIntervention,
        generated_cause: this.filterGeneratedCause,
        timestamp__gte: this.filterDateFrom ? `${this.filterDateFrom}T00:00:00` : undefined,
        timestamp__lte: this.filterDateTo ? `${this.filterDateTo}T23:59:59` : undefined,
      })
      .subscribe({
        next: (data: any) => {
          this.hechos.set(data?.results ?? data);
          this.totalCount = data?.count ?? this.hechos().length;
        },
        error: (err) => console.error('Error loading hechos', err),
      });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadHechos();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadHechos();
  }

  clearFilters() {
    this.filterDateFrom = getFirstDayOfCurrentMonthInputValue();
    this.filterDateTo = getTodayDateInputValue();
    this.filterCategory = '';
    this.filterCamera = '';
    this.filterCocIntervention = '';
    this.filterGeneratedCause = '';
    this.filterSolved = '';
    this.onFilterChange();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadHechos();
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

  loadCameras() {
    this.assetService.getCameras().subscribe({
      next: (data) => this.cameras.set((data as any)?.results ?? data),
      error: (err) => console.error('Error loading cameras', err),
    });
  }

  openForm() {
    if (!this.requireManageHechos()) {
      return;
    }
    this.currentHecho = {
      category: 'OPERATIVO',
      timestamp: getNowDateTimeLocalInputValue(),
      is_solved: false,
      coc_intervention: false,
      generated_cause: false,
    };
    this.showForm.set(true);
  }

  editHecho(hecho: Hecho) {
    if (!this.requireManageHechos()) {
      return;
    }
    this.currentHecho = {
      ...hecho,
      camera: (hecho as any).camera ?? (hecho as any).camera_details?.id ?? null,
      timestamp: toDateTimeLocalInputValue(hecho.timestamp),
      end_time: toDateTimeLocalInputValue(hecho.end_time),
    };
    this.showForm.set(true);
  }

  deleteHecho(id: number) {
    if (!this.requireManageHechos()) {
      return;
    }
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    this.hechosService.deleteHecho(id).subscribe({
      next: () => {
        this.toastService.show('Hecho eliminado', 'success');
        this.loadHechos();
      },
      error: () => this.toastService.show('Error al eliminar', 'error'),
    });
  }

  closeForm() {
    this.showForm.set(false);
  }

  saveHecho() {
    if (!this.requireManageHechos()) {
      return;
    }
    if (!this.currentHecho.timestamp) {
      this.toastService.show('La fecha es obligatoria', 'error');
      return;
    }

    const payload: Partial<Hecho> & { camera_id?: number | null } = {
      ...this.currentHecho,
      camera_id: this.currentHecho.camera ?? null,
      timestamp: new Date(this.currentHecho.timestamp).toISOString(),
      end_time: this.currentHecho.end_time
        ? new Date(this.currentHecho.end_time).toISOString()
        : undefined,
    };
    delete payload.camera;

    const request = this.currentHecho.id
      ? this.hechosService.updateHecho(this.currentHecho.id, payload)
      : this.hechosService.createHecho(payload);

    request.subscribe({
      next: () => {
        this.toastService.show('Hecho guardado correctamente', 'success');
        this.closeForm();
        this.loadHechos();
      },
      error: (err) => {
        console.error(err);
        this.toastService.show('Error al guardar hecho', 'error');
      },
    });
  }

  get maxDate(): string {
    return getTodayDateInputValue();
  }

  get maxDateTime(): string {
    return getNowDateTimeLocalInputValue();
  }
}
