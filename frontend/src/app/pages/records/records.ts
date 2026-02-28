import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { RecordsService } from '../../services/records.service';
import { ToastService } from '../../services/toast.service';
import { AssetService } from '../../services/asset.service';
import { PersonnelService } from '../../services/personnel.service';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './records.html',
  providers: [RecordsService, AssetService, PersonnelService]
})
export class RecordsComponent implements OnInit {
  private recordsService = inject(RecordsService);
  private assetService = inject(AssetService);
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);

  records = signal<any[]>([]);
  cameras = signal<any[]>([]);
  people = signal<any[]>([]);
  showForm = signal(false);
  isEditing = signal(false);
  private editingRecordId: number | null = null;

  verifiedCount = signal(0);
  pendingCount = signal(0);

  newRecord: any = this.createEmptyRecord();

  ngOnInit() {
    this.loadData();
    this.loadMetadata();
  }

  loadData() {
    this.recordsService.getRecords().subscribe({
      next: (data) => {
        this.records.set(data);
        this.updateStats();
      },
      error: () => this.toastService.show('Error al cargar registros', 'error')
    });
  }

  loadMetadata() {
    this.assetService.getCameras().subscribe({
      next: (data) => {
        this.cameras.set(data);
        this.ensureDefaultSelections();
      }
    });
    this.personnelService.getPeople().subscribe({
      next: (data) => {
        this.people.set(data);
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
