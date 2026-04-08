import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActaSignaturePadComponent } from './acta-signature-pad.component';

export interface ActaFormData {
  numero: string;
  grado: string;
  nombre: string;
  aeropuerto: string;
  hora: string;
  firma?: string;
}

@Component({
  selector: 'app-acta-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ActaSignaturePadComponent],
  template: `
    <div class="border-t border-slate-200 pt-5 space-y-3">
      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Datos del Acta</p>
      
      <div>
        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Número de Acta
        </label>
        <input type="text" 
          [(ngModel)]="formData.numero"
          (ngModelChange)="formChange.emit(formData)"
          class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
          placeholder="Ej: 135COCEZE/2025">
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Hora del Acta
          </label>
          <input type="time" 
            [(ngModel)]="formData.hora"
            (ngModelChange)="formChange.emit(formData)"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm">
        </div>
      </div>

      <app-acta-signature-pad 
        #signaturePad
        [width]="signatureWidth"
        [height]="signatureHeight"
        (signatureChange)="onSignatureChange($event)">
      </app-acta-signature-pad>
    </div>
  `,
})
export class ActaFormComponent implements AfterViewInit {
  @Input() formData: ActaFormData = {
    numero: '',
    grado: '',
    nombre: '',
    aeropuerto: '',
    hora: '',
    firma: '',
  };
  
  @Input() signatureWidth = 520;
  @Input() signatureHeight = 100;

  @Output() formChange = new EventEmitter<ActaFormData>();

  @ViewChild('signaturePad') signaturePad!: ActaSignaturePadComponent;

  ngAfterViewInit() {
    // Initialize signature pad after view
  }

  onSignatureChange(signature: string) {
    this.formData.firma = signature;
    this.formChange.emit({ ...this.formData });
  }

  getSignatureBase64(): string {
    return this.signaturePad?.getSignatureBase64() || '';
  }

  clearSignature() {
    this.signaturePad?.clear();
    this.formData.firma = '';
    this.formChange.emit({ ...this.formData });
  }
}
