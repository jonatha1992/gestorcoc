import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  verifiedCount = signal(0);
  pendingCount = signal(0);

  newRecord: any = {
    description: '',
    camera: '',
    record_type: 'VD',
    start_time: '',
    end_time: '',
    operator: '',
    is_verified: false
  };

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
      error: (err) => this.toastService.show('Error al cargar registros', 'error')
    });
  }

  loadMetadata() {
    this.assetService.getCameras().subscribe(data => this.cameras.set(data));
    this.personnelService.getPeople().subscribe(data => this.people.set(data));
  }

  updateStats() {
    const v = this.records().filter(r => r.is_verified).length;
    this.verifiedCount.set(v);
    this.pendingCount.set(this.records().length - v);
  }

  saveRecord() {
    this.recordsService.createRecord(this.newRecord).subscribe({
      next: () => {
        this.toastService.show('Requerimiento registrado', 'success');
        this.showForm.set(false);
        this.resetForm();
        this.loadData();
      },
      error: () => this.toastService.show('Error al registrar evidencia', 'error')
    });
  }

  resetForm() {
    this.newRecord = {
      description: '',
      camera: '',
      record_type: 'VD',
      start_time: '',
      end_time: '',
      operator: '',
      is_verified: false
    };
  }
}
