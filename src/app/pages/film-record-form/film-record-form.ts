import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { FilmRecordService } from '../../services/film-record';
import { UnitService, CctvSystemService, ToastService } from '../../services';
import { LoaderComponent } from '../../components/ui/loader/loader';
import { FilmRecord, CatalogItem, CATALOG_CODES } from '../../models';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
  private unitService = inject(UnitService);
  private cctvService = inject(CctvSystemService);
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
    nroAsunto: ['', [Validators.required]],
    nroOrden: [''],
    fechaIngreso: [new Date().toISOString().split('T')[0]],
    idTipoSolicitud: [''],
    nroSolicitud: [''],
    solicitante: [''],
    causaJudicial: [''],
    caratula: [''],
    fechaHecho: [''],
    idTipoDelito: [''],
    idUnidad: [''],
    recepcionadoPor: [''],
    confeccionadoPor: [''],
    detalle: [''],
    nroDvd: [''],
    nroInforme: [''],
    ifgra: [''],
    nroExpediente: [''],
    actaEntrega: [''],
    fechaSalida: [''],
    retiradoPor: [''],
    idOrganismo: [''],
    estado: ['Pendiente'],
    observaciones: [''],
    orgUnitId: [''],
    orgSystemId: [''],
  });

  // Nuevos Catálogos Organizacionales
  orgUnits$ = this.unitService.getUnits();
  orgSystems$: Observable<any[]> = this.recordForm.get('orgUnitId')!.valueChanges.pipe(
    switchMap((unitId: string) => {
      if (!unitId) return this.cctvService.getSystems();
      return this.cctvService.getSystemsByUnit(unitId);
    })
  );

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
      this.recordService.getFilmRecordById(this.recordId).subscribe((data: FilmRecord) => {
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
    } catch (error: any) {
      console.error('Error saving record:', error);
      this.toast.error('Error al intentar guardar el registro');
    } finally {
      this.isLoading = false;
    }
  }
}
