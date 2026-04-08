import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActaFormData } from './acta-form.component';
import { ActaSignaturePadComponent } from './acta-signature-pad.component';

@Component({
  selector: 'app-row-acta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ActaSignaturePadComponent],
  template: `
    @if (visible && novedad) {
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-bold text-slate-800">Generar Acta</h3>
          <button (click)="closeClick.emit()"
            class="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>
        
        <div class="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <p class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Novedad</p>
          <p class="font-semibold text-slate-800 text-sm">{{ novedad.assetLabel }}</p>
          <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ novedad.description }}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Número de Acta
            </label>
            <input type="text" 
              [(ngModel)]="formData.numero"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="Ej: 135COCEZE/2025">
          </div>

          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Hora
              </label>
              <input type="time" 
                [(ngModel)]="formData.hora"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 text-sm">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Firma Digital (opcional)
            </label>
            <app-acta-signature-pad 
              #signaturePad
              [width]="368"
              [height]="110"
              (signatureChange)="onSignatureChange($event)">
            </app-acta-signature-pad>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeClick.emit()"
              class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all">
              Cancelar
            </button>
            <button type="button" (click)="generateClick.emit()"
              class="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all">
              Generar Acta PDF
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class RowActaModalComponent {
  @Input() visible = false;
  @Input() novedad: any = null;
  @Input() formData: ActaFormData = {
    numero: '',
    grado: '',
    nombre: '',
    aeropuerto: '',
    hora: '',
    firma: '',
  };

  @Output() formDataChange = new EventEmitter<ActaFormData>();
  @Output() closeClick = new EventEmitter<void>();
  @Output() generateClick = new EventEmitter<void>();

  @ViewChild('signaturePad') signaturePad!: ActaSignaturePadComponent;

  onSignatureChange(signature: string) {
    this.formData.firma = signature;
    this.formDataChange.emit({ ...this.formData });
  }

  getSignatureBase64(): string {
    return this.signaturePad?.getSignatureBase64() || '';
  }
}
