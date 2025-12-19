import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FilmRecordService } from '../../services/film-record';
import { FilmRecord } from '../../models/models';

@Component({
  selector: 'app-film-record-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './film-record-form.html',
  styleUrl: './film-record-form.css',
})
export class FilmRecordFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recordService = inject(FilmRecordService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  recordForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    orderNumber: [''],
    entryDate: [new Date().toISOString().split('T')[0]],
    requestType: ['Oficio Judicial'],
    requestNumber: [''],
    requester: [''],
    judicialCase: [''],
    caratula: [''],
    incidentDate: [''],
    crimeType: [''],
    unit: [''],
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
    organization: [''],
    status: ['Pendiente'],
    observations: [''],
  });

  isEditMode = false;
  recordId?: string;

  ngOnInit() {
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

    const recordData: FilmRecord = {
      ...this.recordForm.value
    };

    try {
      if (this.isEditMode && this.recordId) {
        await this.recordService.updateFilmRecord({ ...recordData, id: this.recordId });
      } else {
        await this.recordService.addFilmRecord(recordData);
      }
      this.router.navigate(['/registros']);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Error al guardar el registro');
    }
  }
}
