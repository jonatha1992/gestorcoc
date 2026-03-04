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
import { EncryptionService, AesAlgorithm } from '../../services/encryption.service';
import { HashService, SupportedHashAlgorithm } from '../../services/hash.service';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './records.html',
  providers: [RecordsService, AssetService, PersonnelService, InformeService, EncryptionService, HashService]
})
export class RecordsComponent implements OnInit {
  private recordsService = inject(RecordsService);
  private assetService = inject(AssetService);
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);
  private informeService = inject(InformeService);
  private encryptionService = inject(EncryptionService);
  private hashService = inject(HashService);
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

  // Encryption Modal State
  showEncryptionModal = signal(false);
  encryptionMode: 'encrypt' | 'decrypt' | 'hash' = 'encrypt';
  encryptionPassword = '';
  encryptionAlgorithm: AesAlgorithm = 'AES-256';
  hashAlgorithm: SupportedHashAlgorithm = 'sha256';
  encryptionFile: File | null = null;
  isProcessingEncryption = signal(false);
  hashResult = signal<{ hash: string, time: number } | null>(null);

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
        this.loadInformesMap();
      },
      error: () => this.toastService.show('Error al cargar registros', 'error')
    });
  }

  loadInformesMap() {
    this.informeService.listReports().subscribe({
      next: (informes) => {
        const map: Record<number, any> = {};
        for (const informe of informes) {
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
        error: () => {}
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

  // Encryption Modal Methods
  openEncryptionModal() {
    this.showEncryptionModal.set(true);
    this.encryptionPassword = '';
    this.encryptionFile = null;
    this.encryptionAlgorithm = 'AES-256';
    this.hashAlgorithm = 'sha256';
    this.encryptionMode = 'encrypt';
    this.isProcessingEncryption.set(false);
    this.hashResult.set(null);
  }

  closeEncryptionModal() {
    this.showEncryptionModal.set(false);
    this.encryptionFile = null;
    this.encryptionPassword = '';
    this.hashResult.set(null);
  }

  onEncryptionFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.encryptionFile = files[0];
    }
  }

  onEncryptionFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.encryptionFile = input.files[0];
    }
  }

  async processEncryption() {
    if (!this.encryptionFile) {
      this.toastService.show('Debe seleccionar un archivo.', 'error');
      return;
    }

    if (this.encryptionMode !== 'hash' && !this.encryptionPassword) {
      this.toastService.show('Debe ingresar una contraseña.', 'error');
      return;
    }

    this.isProcessingEncryption.set(true);
    this.hashResult.set(null);

    try {
      if (this.encryptionMode === 'hash') {
        const result = await this.hashService.hashFile(this.encryptionFile, this.hashAlgorithm);
        this.hashResult.set(result);
        this.toastService.show('Cálculo de integridad completado.', 'success');
      } else {
        let resultBlob: Blob;
        const originalName = this.encryptionFile.name;
        let newName = '';

        if (this.encryptionMode === 'encrypt') {
          resultBlob = await this.encryptionService.encryptFile(
            this.encryptionFile,
            this.encryptionPassword,
            this.encryptionAlgorithm
          );
          newName = `${originalName}.aes`;
        } else {
          resultBlob = await this.encryptionService.decryptFile(
            this.encryptionFile,
            this.encryptionPassword,
            this.encryptionAlgorithm
          );
          newName = originalName.endsWith('.aes') ? originalName.slice(0, -4) : `decrypted_${originalName}`;
        }

        // Download the file programmatically
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.toastService.show(`Archivo ${this.encryptionMode === 'encrypt' ? 'cifrado' : 'descifrado'} con éxito.`, 'success');
        this.closeEncryptionModal();
      }
    } catch (err: any) {
      this.toastService.show(`Error al procesar el archivo: ${err.message || err}`, 'error');
    } finally {
      this.isProcessingEncryption.set(false);
    }
  }
}
