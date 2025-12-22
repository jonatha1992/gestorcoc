import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FilmRecordService } from '../../services/film-record';
import { CatalogService } from '../../services/catalog.service';
import { ToastService } from '../../services/toast.service';
import { LoaderComponent } from '../../components/ui/loader/loader';
import { FilmRecord, CatalogItem, CATALOG_CODES } from '../../models';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-film-record-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './film-record-form.html',
})
export class FilmRecordFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recordService = inject(FilmRecordService);
  private catalogService = inject(CatalogService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = false;

  // Catálogos para dropdowns
  requestTypes$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.TIPOS_SOLICITUD);
  crimeTypes$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.TIPOS_DELITO);
  units$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.UNIDADES);
  organizations$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.ORGANISMOS);

  recordForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    orderNumber: [''],
    entryDate: [new Date().toISOString().split('T')[0]],
    requestTypeId: [''],
    requestNumber: [''],
    requester: [''],
    judicialCase: [''],
    caratula: [''],
    incidentDate: [''],
    crimeTypeId: [''],
    unitId: [''],
    receivedBy: [''],
    madeBy: [''],
    detail: [''],
    dvdNumber: [''],
    reportNumber: [''],
    ifgra: [''],
    fileNumber: [''],
    deliveryAct: [''],
    exitDate: [''],
    withdrawnBy: [''],
    organizationId: [''],
    status: ['Pendiente'],
    observations: [''],
  });

  // Estados hardcodeados
  statuses = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En Proceso', label: 'En Proceso' },
    { value: 'Finalizado', label: 'Finalizado' },
  ];

  isEditMode = false;
  recordId?: string;

  ngOnInit() {
    // Modo edición
    this.recordId = this.route.snapshot.params['id'];
    if (this.recordId) {
      this.isEditMode = true;
      this.recordService.getFilmRecordById(this.recordId).subscribe(data => {
        if (data) {
          this.recordForm.patchValue(data);
        }
      });
    }
  }

  async onSubmit() {
    if (this.recordForm.invalid) return;

    const formValue = this.recordForm.value;

    const recordData: FilmRecord = {
      ...formValue,
      createdAt: this.isEditMode ? undefined : Timestamp.now(),
      createdBy: this.isEditMode ? undefined : 'system',
      updatedAt: this.isEditMode ? Timestamp.now() : undefined,
      updatedBy: this.isEditMode ? 'system' : undefined,
    };

    // Limpiar campos undefined
    Object.keys(recordData).forEach(key => {
      if (recordData[key as keyof FilmRecord] === undefined) {
        delete recordData[key as keyof FilmRecord];
      }
    });

    this.isLoading = true;
    try {
      if (this.isEditMode && this.recordId) {
        await this.recordService.updateFilmRecord({ ...recordData, id: this.recordId });
        this.toast.success('Registro actualizado con éxito');
      } else {
        await this.recordService.addFilmRecord(recordData);
        this.toast.success('Nuevo registro guardado');
      }
      this.router.navigate(['/registros']);
    } catch (error) {
      console.error('Error saving record:', error);
      this.toast.error('Error al intentar guardar el registro');
    } finally {
      this.isLoading = false;
    }
  }
}
