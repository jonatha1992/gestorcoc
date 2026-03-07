import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RecordsService } from '../../services/records.service';
import { ToastService } from '../../services/toast.service';
import { PersonnelService } from '../../services/personnel.service';
import { InformeService } from '../../services/informe.service';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './records.html',
  providers: [RecordsService, PersonnelService, InformeService]
})
export class RecordsComponent implements OnInit {
  private recordsService = inject(RecordsService);
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);
  private informeService = inject(InformeService);
  private router = inject(Router);

  records = signal<any[]>([]);
  people = signal<any[]>([]);
  informesMap = signal<Record<number, any>>({});
  operatorSystems = signal<{ id: number; name: string }[]>([]);
  sistemaIsCustom = signal(false);
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
    this.personnelService.getPeople().subscribe({
      next: (data) => {
        this.people.set((data as any)?.results ?? data);
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
      issue_number: record?.issue_number || '',
      order_number: record?.order_number ?? '',
      entry_date: record?.entry_date || '',
      request_type: record?.request_type || '',
      request_number: record?.request_number || '',
      requester: record?.requester || '',
      judicial_case_number: record?.judicial_case_number || '',
      case_title: record?.case_title || '',
      incident_date: record?.incident_date || '',
      crime_type: record?.crime_type || '',
      intervening_department: record?.intervening_department || '',
      received_by: record?.received_by ?? '',
      operator: record?.operator ?? '',
      sistema: record?.sistema || '',
      dvd_number: record?.dvd_number || '',
      report_number: record?.report_number || '',
      ifgra_number: record?.ifgra_number || '',
      expediente_number: record?.expediente_number || '',
      start_time: this.toDateTimeLocal(record?.start_time),
      end_time: this.toDateTimeLocal(record?.end_time),
      delivery_act_number: record?.delivery_act_number || '',
      delivery_date: record?.delivery_date || '',
      retrieved_by: record?.retrieved_by || '',
      organism: record?.organism || '',
      delivery_status: record?.delivery_status || 'PENDIENTE',
      description: record?.description || '',
      observations: record?.observations || '',
      is_integrity_verified: !!record?.is_integrity_verified
    };
    this.isEditing.set(true);
    this.editingRecordId = record?.id ?? null;
    this.showForm.set(true);
    if (record?.operator) {
      this.onOperatorChange(record.operator);
    }
  }

  saveRecord() {
    if (!this.newRecord.operator) {
      this.toastService.show('Debe seleccionar un operador.', 'warning');
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

  onOperatorChange(operatorId: number | string) {
    const person = this.people().find(p => p.id === +operatorId);
    const systems: { id: number; name: string }[] = person?.assigned_systems_details ?? [];
    this.operatorSystems.set(systems);
    if (!this.isEditing()) {
      if (systems.length === 1) {
        this.newRecord.sistema = systems[0].name;
        this.sistemaIsCustom.set(false);
      } else {
        this.sistemaIsCustom.set(true);
      }
    } else {
      const currentSistema = this.newRecord.sistema || '';
      const isKnown = systems.some(s => s.name === currentSistema);
      this.sistemaIsCustom.set(!isKnown || systems.length === 0);
    }
  }

  onSistemaSelectChange(value: string) {
    if (value === '__otro__') {
      this.sistemaIsCustom.set(true);
      this.newRecord.sistema = '';
    }
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
      issue_number: '',
      order_number: '',
      entry_date: '',
      request_type: '',
      request_number: '',
      requester: '',
      judicial_case_number: '',
      case_title: '',
      incident_date: '',
      crime_type: '',
      intervening_department: '',
      received_by: '',
      operator: '',
      sistema: '',
      dvd_number: '',
      report_number: '',
      ifgra_number: '',
      expediente_number: '',
      start_time: '',
      end_time: '',
      delivery_act_number: '',
      delivery_date: '',
      retrieved_by: '',
      organism: '',
      delivery_status: 'PENDIENTE',
      description: '',
      observations: '',
      is_integrity_verified: false
    };
  }

  resetForm() {
    this.newRecord = this.createEmptyRecord();
    this.operatorSystems.set([]);
    this.sistemaIsCustom.set(false);
    this.isEditing.set(false);
    this.editingRecordId = null;
  }
}
