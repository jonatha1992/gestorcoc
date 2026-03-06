import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RecordsService } from '../../services/records.service';
import { ToastService } from '../../services/toast.service';
import { AssetService } from '../../services/asset.service';
import { PersonnelService } from '../../services/personnel.service';
import { InformeService } from '../../services/informe.service';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './records.html',
  providers: [RecordsService, AssetService, PersonnelService, InformeService]
})
export class RecordsComponent implements OnInit {
  private recordsService = inject(RecordsService);
  private assetService = inject(AssetService);
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);
  private informeService = inject(InformeService);
  private router = inject(Router);

  records = signal<any[]>([]);
  cameras = signal<any[]>([]);
  people = signal<any[]>([]);
  informesMap = signal<Record<number, any>>({});
  showForm = signal(false);
  isEditing = signal(false);
  private editingRecordId: number | null = null;

  selectedRecord = signal<any | null>(null);
  selectedInforme = signal<any | null>(null);
  showDetailPanel = signal(false);

  verifiedCount = signal(0);
  pendingCount = signal(0);

  // Pagination
  currentPage = 1;
  totalCount = 0;
  pageSize = 50;
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  // Filters
  searchText = '';
  filterDeliveryStatus = '';
  filterVerified = '';
  filterHasBackup = '';
  filterCamera = '';
  filterOperator = '';
  filterDateFrom = '';
  filterDateTo = '';
  private searchTimer: any;

  newRecord: any = this.createEmptyRecord();

  ngOnInit() {
    this.loadData();
    this.loadMetadata();
  }

  loadData() {
    this.recordsService.getRecords(this.currentPage, {
      search: this.searchText || undefined,
      delivery_status: this.filterDeliveryStatus || undefined,
      is_integrity_verified: this.filterVerified,
      has_backup: this.filterHasBackup,
      camera: this.filterCamera || undefined,
      operator: this.filterOperator || undefined,
      entry_date__gte: this.filterDateFrom || undefined,
      entry_date__lte: this.filterDateTo || undefined,
    }).subscribe({
      next: (data) => {
        const results = (data as any)?.results ?? data;
        this.records.set(results);
        this.totalCount = (data as any)?.count ?? results.length;
        this.updateStats();
        this.loadInformesMap();
      },
      error: () => this.toastService.show('Error al cargar registros', 'error')
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterCamera = '';
    this.filterOperator = '';
    this.filterVerified = '';
    this.filterHasBackup = '';
    this.filterDeliveryStatus = '';
    this.onFilterChange();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
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

  loadInformesMap() {
    this.informeService.listReports().subscribe({
      next: (informes) => {
        const list: any[] = (informes as any)?.results ?? informes;
        const map: Record<number, any> = {};
        for (const informe of list) {
          if (informe.film_record != null) {
            map[informe.film_record] = informe;
          }
        }
        this.informesMap.set(map);
      },
      error: () => { }
    });
  }

  openDetail(record: any) {
    this.selectedRecord.set(record);
    this.selectedInforme.set(null);
    this.showDetailPanel.set(true);
    const informe = this.informesMap()[record.id];
    if (informe?.id) {
      this.informeService.getReport(informe.id).subscribe({
        next: (full) => this.selectedInforme.set(full),
        error: () => { }
      });
    }
  }

  closeDetail() {
    this.showDetailPanel.set(false);
    this.selectedRecord.set(null);
    this.selectedInforme.set(null);
  }

  getInformeForRecord(recordId: number): any | null {
    return this.informesMap()[recordId] ?? null;
  }

  openInforme(record: any) {
    const existing = this.informesMap()[record.id];
    if (existing) {
      void this.router.navigate(['/informes'], { queryParams: { informe_id: existing.id } });
    } else {
      void this.router.navigate(['/informes'], { queryParams: { record_id: record.id } });
    }
  }

  loadMetadata() {
    this.assetService.getCameras().subscribe({
      next: (data) => {
        this.cameras.set((data as any)?.results ?? data);
        this.ensureDefaultSelections();
      }
    });
    this.personnelService.getPeople().subscribe({
      next: (data) => {
        this.people.set((data as any)?.results ?? data);
        this.ensureDefaultSelections();
      }
    });
  }

  updateStats() {
    const v = this.records().filter((record) => this.isRecordVerified(record)).length;
    this.verifiedCount.set(v);
    this.pendingCount.set(this.records().length - v);
  }

  openCreateForm() {
    this.resetForm();
    this.isEditing.set(false);
    this.editingRecordId = null;
    this.showForm.set(true);
  }

  editRecord(record: any) {
    this.newRecord = {
      description: record?.description || '',
      camera: record?.camera ?? '',
      record_type: record?.record_type || 'VD',
      start_time: this.toDateTimeLocal(record?.start_time),
      end_time: this.toDateTimeLocal(record?.end_time),
      operator: record?.operator ?? '',
      delivery_status: record?.delivery_status || 'PENDIENTE',
      is_integrity_verified: !!record?.is_integrity_verified
    };
    this.isEditing.set(true);
    this.editingRecordId = record?.id ?? null;
    this.showForm.set(true);
    this.ensureDefaultSelections();
  }

  saveRecord() {
    if (!this.newRecord.camera || !this.newRecord.operator) {
      this.toastService.show('Debe seleccionar cámara y operador.', 'warning');
      return;
    }

    const payload = {
      ...this.newRecord,
      is_integrity_verified: !!this.newRecord.is_integrity_verified
    };

    if (this.isEditing() && this.editingRecordId) {
      this.persistRecord(
        this.recordsService.updateRecord(this.editingRecordId, payload),
        'Registro actualizado',
        'Error al actualizar el registro'
      );
      return;
    }

    this.persistRecord(
      this.recordsService.createRecord(payload),
      'Requerimiento registrado',
      'Error al registrar evidencia'
    );
  }

  deleteRecord(record: any) {
    if (!record?.id) {
      return;
    }

    const label = (record?.description || '').trim() || `#${record.id}`;
    const confirmed = confirm(`¿Eliminar registro ${label}?`);
    if (!confirmed) {
      return;
    }

    this.recordsService.deleteRecord(record.id).subscribe({
      next: () => {
        this.toastService.show('Registro eliminado', 'success');
        this.loadData();
      },
      error: () => this.toastService.show('Error al eliminar registro', 'error')
    });
  }

  getOperatorName(record: any): string {
    return record?.operator_full_name || record?.operator_name || '-';
  }

  isRecordVerified(record: any): boolean {
    return !!(
      record?.is_integrity_verified ||
      record?.is_verified ||
      record?.verified_by_crev ||
      record?.verification_date
    );
  }

  private persistRecord(request$: Observable<any>, successMessage: string, errorMessage: string) {
    request$.subscribe({
      next: () => {
        this.toastService.show(successMessage, 'success');
        this.showForm.set(false);
        this.resetForm();
        this.loadData();
      },
      error: () => this.toastService.show(errorMessage, 'error')
    });
  }

  private ensureDefaultSelections() {
    if (!this.newRecord.camera && this.cameras().length > 0) {
      this.newRecord.camera = this.cameras()[0].id;
    }
    if (!this.newRecord.operator && this.people().length > 0) {
      this.newRecord.operator = this.people()[0].id;
    }
  }

  private toDateTimeLocal(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offsetMinutes = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offsetMinutes * 60_000);
    return local.toISOString().slice(0, 16);
  }

  private createEmptyRecord() {
    return {
      description: '',
      camera: '',
      record_type: 'VD',
      start_time: '',
      end_time: '',
      operator: '',
      delivery_status: 'PENDIENTE',
      is_integrity_verified: false
    };
  }

  resetForm() {
    this.newRecord = this.createEmptyRecord();
    this.ensureDefaultSelections();
    this.isEditing.set(false);
    this.editingRecordId = null;
  }
}
