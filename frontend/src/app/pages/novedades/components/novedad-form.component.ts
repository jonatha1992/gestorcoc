import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovedadAssetSelectorComponent, TargetType } from './novedad-asset-selector.component';
import { ActaFormComponent, ActaFormData } from './acta-form.component';

export interface NovedadForm {
  camera: number | null;
  server: number | null;
  system: number | null;
  cameraman_gear: number | null;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incident_type: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  coc_ticket_number?: string | null;
}

@Component({
  selector: 'app-novedad-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NovedadAssetSelectorComponent, ActaFormComponent],
  template: `
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
          <h3 class="text-lg font-bold text-slate-800">{{ isEditing ? 'Editar Novedad' : 'Registrar Nueva Novedad' }}</h3>
          <button (click)="closeClick.emit()"
            class="text-slate-400 hover:text-slate-600 font-bold text-xl transition-colors">&times;</button>
        </div>
        
        <form (submit)="saveClick.emit($event)" class="p-6 space-y-4">
          <!-- Selector de Activos -->
          <app-novedad-asset-selector
            [targetType]="targetType"
            [selectedAssets]="selectedAssets"
            [systems]="systems"
            [servers]="servers"
            [cameras]="cameras"
            [gear]="gear"
            (targetTypeChange)="targetTypeChange.emit($event)"
            (selectedAssetsChange)="selectedAssetsChange.emit($event)">
          </app-novedad-asset-selector>

          <!-- Descripción -->
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Descripción
            </label>
            <textarea 
              [(ngModel)]="formData.description"
              name="description"
              rows="3"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              placeholder="Detalle la novedad..." 
              required></textarea>
          </div>

          <!-- Severidad y Tipo -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Severidad
              </label>
              <select
                [(ngModel)]="formData.severity"
                name="severity"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm">
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Tipo de Incidente
              </label>
              <input type="text"
                [(ngModel)]="formData.incident_type"
                name="incident_type"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                placeholder="e.g. FALLA_TECNICA">
            </div>
          </div>

          <!-- Ticket COC -->
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Número de Ticket COC <span class="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="text"
              [(ngModel)]="formData.coc_ticket_number"
              name="coc_ticket_number"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              placeholder="Ej: TICK-2026-00123">
          </div>

          <!-- Formulario de Acta -->
          <app-acta-form
            [formData]="actaFormData"
            [signatureWidth]="520"
            [signatureHeight]="100"
            (formChange)="actaFormChange.emit($event)">
          </app-acta-form>

          <!-- Botones de Acción -->
          <div class="pt-3 flex gap-2 sticky bottom-0 bg-white border-t border-slate-100 pt-4">
            <button type="button" (click)="closeClick.emit()"
              class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-sm">
              Cancelar
            </button>
            @if (isEditing) {
            <button type="submit" 
              [disabled]="!canEdit"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Actualizar
            </button>
            } @else {
            <button type="submit" 
              [disabled]="!canCreate"
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Guardar
            </button>
            <button type="submit" 
              (click)="generateActaAfterSaveChange.emit(true)"
              [disabled]="!canCreate"
              class="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Guardar y Generar Acta
            </button>
            }
          </div>
        </form>
      </div>
    </div>
  `,
})
export class NovedadFormComponent {
  @Input() formData: NovedadForm = {
    camera: null,
    server: null,
    system: null,
    cameraman_gear: null,
    description: '',
    severity: 'MEDIUM',
    incident_type: 'FALLA_TECNICA',
    status: 'OPEN',
    coc_ticket_number: null,
  };

  @Input() actaFormData: ActaFormData = {
    numero: '',
    grado: '',
    nombre: '',
    aeropuerto: '',
    hora: '',
    firma: '',
  };

  @Input() targetType: TargetType = 'CAMERA';
  @Input() selectedAssets: any[] = [];
  @Input() systems: any[] = [];
  @Input() servers: any[] = [];
  @Input() cameras: any[] = [];
  @Input() gear: any[] = [];
  @Input() isEditing = false;
  @Input() canCreate = false;
  @Input() canEdit = false;

  @Output() formDataChange = new EventEmitter<NovedadForm>();
  @Output() actaFormChange = new EventEmitter<ActaFormData>();
  @Output() targetTypeChange = new EventEmitter<TargetType>();
  @Output() selectedAssetsChange = new EventEmitter<any[]>();
  @Output() generateActaAfterSaveChange = new EventEmitter<boolean>();
  @Output() saveClick = new EventEmitter<Event>();
  @Output() closeClick = new EventEmitter<void>();
}
