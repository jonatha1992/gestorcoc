import { Component, OnInit, inject, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AssetService } from '../../services/asset.service';
import { InformeService } from '../../services/informe.service';
import { PersonnelService } from '../../services/personnel.service';
import { RecordsService } from '../../services/records.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PermissionCodes } from '../../auth/auth.models';
import {
  getFirstDayOfCurrentMonthInputValue,
  getTodayDateInputValue,
  toDateTimeLocalInputValue,
} from '../../utils/date-inputs';

export interface FilmRecord {
  id: number;
  issue_number: string;
  order_number: number;
  entry_date: string;
  request_type: string;
  request_kind: string;
  request_number: string;
  requester: string;
  judicial_case_number: string;
  case_title: string;
  incident_date: string;
  incident_time: string;
  incident_place: string;
  incident_sector: string;
  crime_type: string;
  criminal_problematic: string;
  incident_modality: string;
  intervening_department: string;
  judicial_office: string;
  judicial_secretary: string;
  judicial_holder: string;
  generator_unit: number;
  sistema: string;
  received_by: number | '' | null;
  operator: string;
  description: string;
  dvd_number: string;
  report_number: string;
  ifgra_number: string;
  expediente_number: string;
  delivery_act_number: string;
  delivery_date: string;
  retrieved_by: string;
  organism: string;
  delivery_status: string;
  observations: string;
  has_backup: boolean;
  backup_path: string;
  file_hash: string;
  hash_algorithm: string;
  file_size: number;
  is_integrity_verified: boolean;
  verified_by_crev: number;
  verification_date: string;
  is_editable: boolean;
}

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './records.html',
  providers: [RecordsService, PersonnelService, InformeService, AssetService]
})
export class RecordsComponent implements OnInit {
  private recordsService = inject(RecordsService);
  private personnelService = inject(PersonnelService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);
  private informeService = inject(InformeService);
  private router = inject(Router);
  readonly authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  records = signal<any[]>([]);
  people = signal<any[]>([]);
  units = signal<any[]>([]);
  informesMap = signal<Record<number, any>>({});
  showForm = signal(false);
  isEditing = signal(false);
  private editingRecordId: number | null = null;
  showPhysicalSupport = signal(false);
  showDeliveryStatus = signal(false);

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
  filterDateFrom = getFirstDayOfCurrentMonthInputValue();
  filterDateTo = getTodayDateInputValue();
  private searchTimer: any;

  newRecord: any = this.createEmptyRecord();
  invalidFields = new Set<string>();
  validationMessage = '';

  get canManageRecords(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_RECORDS);
  }

  get canUseReportTools(): boolean {
    return this.authService.hasPermission(PermissionCodes.USE_REPORTS);
  }

  get canVerifyCrev(): boolean {
    return this.authService.hasPermission(PermissionCodes.VERIFY_CREV);
  }

  private requireManageRecords(): boolean {
    if (this.canManageRecords) {
      return true;
    }
    this.toastService.show('No tiene permiso para modificar registros.', 'warning');
    return false;
  }

  isFieldInvalid(fieldName: string): boolean {
    return this.invalidFields.has(fieldName);
  }


  ngOnInit() {
    this.loadData();
    // No cargamos metadatos al inicio, se cargan al abrir el formulario
    // this.loadMetadata();
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
        this.ngZone.run(() => {
          const results = (data as any)?.results ?? data;
          this.records.set(results);
          this.totalCount = (data as any)?.count ?? results.length;
          this.updateStats();
          this.loadInformesMap();
          this.cdr.detectChanges();
        });
      },
      error: () => this.ngZone.run(() => {
        this.toastService.show('Error al cargar registros', 'error');
        this.cdr.detectChanges();
      })
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
    this.filterDateFrom = getFirstDayOfCurrentMonthInputValue();
    this.filterDateTo = getTodayDateInputValue();
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
        this.ngZone.run(() => {
          const list: any[] = (informes as any)?.results ?? informes;
          const map: Record<number, any> = {};
          for (const informe of list) {
            if (informe.film_record != null) {
              map[informe.film_record] = informe;
            }
          }
          this.informesMap.set(map);
          this.cdr.detectChanges();
        });
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
    if (!this.canUseReportTools) {
      this.toastService.show('No tiene permiso para trabajar con informes.', 'warning');
      return;
    }
    const existing = this.informesMap()[record.id];
    if (existing) {
      void this.router.navigate(['/informes'], { queryParams: { informe_id: existing.id } });
    } else {
      void this.router.navigate(['/informes'], { queryParams: { record_id: record.id } });
    }
  }

  loadMetadata() {
    if (this.people().length === 0) {
      this.personnelService.getPeople().subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.people.set((data as any)?.results ?? data);
            this.cdr.detectChanges();
          });
        }
      });
    }

    if (this.units().length === 0) {
      this.assetService.getUnits().subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            const units = (data as any)?.results ?? data;
            this.units.set(Array.isArray(units) ? units : []);
            this.cdr.detectChanges();
          });
        },
        error: () => this.ngZone.run(() => {
          this.units.set([]);
          this.cdr.detectChanges();
        })
      });
    }
  }

  updateStats() {
    const v = this.records().filter((record) => this.isRecordVerified(record)).length;
    this.verifiedCount.set(v);
    this.pendingCount.set(this.records().length - v);
  }

  openCreateForm() {
    if (!this.requireManageRecords()) {
      return;
    }
    this.loadMetadata();
    this.resetForm();
    this.invalidFields.clear();
    this.validationMessage = '';
    this.isEditing.set(false);
    this.editingRecordId = null;
    this.showPhysicalSupport.set(false);
    this.showDeliveryStatus.set(false);
    this.showForm.set(true);
  }

  editRecord(record: any) {
    if (!this.requireManageRecords()) {
      return;
    }
    this.loadMetadata();
    const involvedPeople = Array.isArray(record?.involved_people)
      ? record.involved_people.map((person: any) => ({
        role: person?.role || 'OTRO',
        last_name: person?.last_name || '',
        first_name: person?.first_name || '',
        document_type: person?.document_type || '',
        document_number: person?.document_number || '',
        nationality: person?.nationality || '',
        birth_date: person?.birth_date || ''
      }))
      : [];

    this.newRecord = {
      issue_number: record?.issue_number || '',
      order_number: record?.order_number ?? '',
      entry_date: record?.entry_date || this.getTodayDate(),
      request_type: record?.request_type || '',
      request_kind: record?.request_kind || '',
      request_number: record?.request_number || '',
      requester: record?.requester || '',
      judicial_case_number: record?.judicial_case_number || '',
      case_title: record?.case_title || '',
      incident_date: record?.incident_date || '',
      incident_time: this.toTimeInput(record?.incident_time),
      incident_place: record?.incident_place || record?.incident_sector || '',
      incident_sector: record?.incident_sector || record?.incident_place || '',
      crime_type: record?.crime_type || '',
      criminal_problematic: record?.criminal_problematic || '',
      incident_modality: record?.incident_modality || '',
      intervening_department: record?.intervening_department || '',
      judicial_office: record?.judicial_office || record?.requester || '',
      judicial_secretary: record?.judicial_secretary || '',
      judicial_holder: record?.judicial_holder || '',
      generator_unit: record?.generator_unit ?? '',
      received_by: null,
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
      is_integrity_verified: !!record?.is_integrity_verified,
      involved_people: involvedPeople.length > 0 ? involvedPeople : [this.createEmptyInvolvedPerson()]
    };

    // Detectar si hay datos en secciones opcionales para mostrarlas
    this.showPhysicalSupport.set(
      !!(record?.dvd_number || record?.report_number || record?.ifgra_number || record?.expediente_number)
    );
    this.showDeliveryStatus.set(
      !!(record?.delivery_act_number || record?.delivery_date || record?.retrieved_by || record?.organism || (record?.delivery_status && record?.delivery_status !== 'PENDIENTE'))
    );

    this.isEditing.set(true);
    this.editingRecordId = record?.id ?? null;
    this.showForm.set(true);
  }

  verifyRecord(record: any) {
    if (!this.canVerifyCrev) {
      this.toastService.show('No tiene permiso para verificar por CREV.', 'warning');
      return;
    }

    const observations = prompt('Observaciones de verificacion CREV (opcional):', '');
    if (observations === null) {
      return;
    }

    this.recordsService.verifyByCrev(record.id, observations).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          const updatedRecord = response?.record ?? response;
          this.toastService.show('Registro verificado por CREV.', 'success');
          if (this.selectedRecord()?.id === updatedRecord?.id) {
            this.selectedRecord.set(updatedRecord);
          }
          this.loadData();
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          const detail = error?.error?.error || error?.error?.detail || 'No se pudo verificar el registro.';
          this.toastService.show(detail, 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  saveRecord() {
    if (!this.requireManageRecords()) {
      return;
    }
    this.invalidFields.clear();
    this.validationMessage = '';

    const textValue = (value: unknown) => String(value ?? '').trim();

    // Validamos manualmente para llenar invalidFields
    if (!textValue(this.newRecord.request_kind)) this.invalidFields.add('request_kind');
    if (!textValue(this.newRecord.issue_number)) this.invalidFields.add('issue_number');
    if (!textValue(this.newRecord.case_title)) this.invalidFields.add('case_title');
    if (!textValue(this.newRecord.judicial_case_number)) this.invalidFields.add('judicial_case_number');
    if (!textValue(this.newRecord.judicial_office)) this.invalidFields.add('judicial_office');
    if (!this.newRecord.generator_unit) this.invalidFields.add('generator_unit');
    if (!this.newRecord.operator) this.invalidFields.add('operator');

    if (this.invalidFields.size > 0) {
      const missingLabels: string[] = [];
      if (this.invalidFields.has('request_kind')) missingLabels.push('Denuncia / Procedimiento');
      if (this.invalidFields.has('issue_number')) missingLabels.push('Nro. Asunto');
      if (this.invalidFields.has('case_title')) missingLabels.push('Caratula');
      if (this.invalidFields.has('judicial_case_number')) missingLabels.push('Nro. Causa Judicial');
      if (this.invalidFields.has('judicial_office')) missingLabels.push('Juzgado / Fiscalia');
      if (this.invalidFields.has('generator_unit')) missingLabels.push('Unidad Generadora');
      if (this.invalidFields.has('operator')) missingLabels.push('Responsable a Cargo');

      this.validationMessage = `Completa los datos mínimos requeridos: ${missingLabels.join(', ')}.`;
      this.toastService.show(this.validationMessage, 'warning');
      return;
    }


    const involvedPeople = this.normalizeInvolvedPeople();
    if (involvedPeople === null) {
      return;
    }

    const unifiedLocation = (this.newRecord.incident_place || this.newRecord.incident_sector || '').trim();

    const payload = {
      ...this.newRecord,
      received_by: null,
      incident_place: unifiedLocation,
      incident_sector: unifiedLocation,
      is_integrity_verified: !!this.newRecord.is_integrity_verified,
      entry_date: this.newRecord.entry_date || this.getTodayDate(),
      involved_people: involvedPeople,
    };

    this.normalizeJudicialFields(payload);
    this.normalizePayloadToUppercase(payload);

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

  private getMissingMinimumFields(): string[] {
    const textValue = (value: unknown) => String(value ?? '').trim();
    const missing: string[] = [];

    if (!textValue(this.newRecord.request_kind)) {
      missing.push('Denuncia / Procedimiento');
    }
    if (!textValue(this.newRecord.issue_number)) {
      missing.push('Nro. Asunto');
    }
    if (!textValue(this.newRecord.case_title)) {
      missing.push('Caratula');
    }
    if (!textValue(this.newRecord.judicial_case_number)) {
      missing.push('Nro. Causa Judicial');
    }
    if (!textValue(this.newRecord.judicial_office)) {
      missing.push('Juzgado / Fiscalia');
    }
    if (!this.newRecord.generator_unit) {
      missing.push('Unidad Generadora');
    }
    if (!this.newRecord.operator) {
      missing.push('Responsable a Cargo');
    }

    return missing;
  }

  deleteRecord(record: any) {
    if (!this.requireManageRecords()) {
      return;
    }
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
        this.ngZone.run(() => {
          this.toastService.show('Registro eliminado', 'success');
          this.loadData();
          this.cdr.detectChanges();
        });
      },
      error: () => this.ngZone.run(() => {
        this.toastService.show('Error al eliminar registro', 'error');
        this.cdr.detectChanges();
      })
    });
  }

  addInvolvedPerson() {
    this.newRecord.involved_people = [...(this.newRecord.involved_people || []), this.createEmptyInvolvedPerson()];
  }

  removeInvolvedPerson(index: number) {
    const people: any[] = [...(this.newRecord.involved_people || [])];
    if (people.length <= 1) {
      this.newRecord.involved_people = [this.createEmptyInvolvedPerson()];
      return;
    }
    people.splice(index, 1);
    this.newRecord.involved_people = people;
  }

  getInvolvedPersonAge(person: any): number | null {
    if (!person?.birth_date) {
      return null;
    }
    const birthDate = new Date(person.birth_date);
    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const hasNotHadBirthday =
      now.getMonth() < birthDate.getMonth() ||
      (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate());

    if (hasNotHadBirthday) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  getOperatorName(record: any): string {
    return record?.operator_full_name || record?.operator_name || record?.operator || '-';
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
        this.ngZone.run(() => {
          this.toastService.show(successMessage, 'success');
          this.showForm.set(false);
          this.resetForm();
          this.loadData();
          this.cdr.detectChanges();
        });
      },
      error: () => this.ngZone.run(() => {
        this.toastService.show(errorMessage, 'error');
        this.cdr.detectChanges();
      })
    });
  }

  private normalizeInvolvedPeople(): any[] | null {
    const rawPeople: any[] = Array.isArray(this.newRecord.involved_people) ? this.newRecord.involved_people : [];
    const normalized = rawPeople.map((person) => ({
      role: (person?.role || 'OTRO').trim() || 'OTRO',
      last_name: (person?.last_name || '').trim(),
      first_name: (person?.first_name || '').trim(),
      document_type: (person?.document_type || '').trim(),
      document_number: (person?.document_number || '').trim(),
      nationality: (person?.nationality || '').trim(),
      birth_date: person?.birth_date || null,
    }));

    const hasPartialRow = normalized.some((person) => {
      const hasAny = !!(
        person.last_name ||
        person.first_name ||
        person.document_type ||
        person.document_number ||
        person.nationality ||
        person.birth_date
      );
      const missingIdentity = !person.last_name || !person.first_name;
      return hasAny && missingIdentity;
    });

    if (hasPartialRow) {
      this.toastService.show('Cada persona involucrada debe tener apellido y nombre.', 'warning');
      return null;
    }

    return normalized.filter((person) => person.last_name && person.first_name);
  }

  private normalizeJudicialFields(payload: any) {
    const toNC = (value: any) => {
      const text = (value ?? '').toString().trim();
      return text ? text : 'N/C';
    };

    payload.judicial_office = toNC(payload.judicial_office);
    payload.judicial_secretary = toNC(payload.judicial_secretary);
    payload.judicial_holder = toNC(payload.judicial_holder);

    const requester = (payload.requester || '').toString().trim();
    payload.requester = requester || payload.judicial_office;
    payload.judicial_office = payload.judicial_office || payload.requester;
  }

  private toDateTimeLocal(value: string | null | undefined): string {
    return toDateTimeLocalInputValue(value);
  }

  private toTimeInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    if (value.includes(':')) {
      return value.slice(0, 5);
    }
    return '';
  }

  private getTodayDate(): string {
    return getTodayDateInputValue();
  }

  get maxDate(): string {
    return getTodayDateInputValue();
  }

  private createEmptyInvolvedPerson() {
    return {
      role: 'OTRO',
      last_name: '',
      first_name: '',
      document_type: 'DNI',
      document_number: '',
      nationality: '',
      birth_date: '',
    };
  }

  private createEmptyRecord() {
    return {
      issue_number: '',
      order_number: '',
      entry_date: this.getTodayDate(),
      request_type: '',
      request_kind: '',
      request_number: '',
      requester: '',
      judicial_case_number: '',
      case_title: '',
      incident_date: '',
      incident_time: '',
      incident_place: '',
      incident_sector: '',
      crime_type: '',
      criminal_problematic: '',
      incident_modality: '',
      intervening_department: '',
      judicial_office: '',
      judicial_secretary: '',
      judicial_holder: '',
      generator_unit: '',
      received_by: null,
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
      is_integrity_verified: false,
      involved_people: [this.createEmptyInvolvedPerson()]
    };
  }

  resetForm() {
    this.newRecord = this.createEmptyRecord();
    this.isEditing.set(false);
    this.editingRecordId = null;
    this.showPhysicalSupport.set(false);
    this.showDeliveryStatus.set(false);
  }

  private normalizePayloadToUppercase(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (typeof value === 'string') {
        obj[key] = value.toUpperCase().trim();
      } else if (Array.isArray(value)) {
        value.forEach(item => this.normalizePayloadToUppercase(item));
      } else if (value && typeof value === 'object') {
        this.normalizePayloadToUppercase(value);
      }
    });
  }
}

