import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordsService } from '../services/records.service';
import { ToastService } from '../services/toast.service';
import { AssetService } from '../services/asset.service';
import { PersonnelService } from '../services/personnel.service';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div class="flex justify-end items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <button (click)="showForm.set(true)" 
                class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nuevo Requerimiento
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div class="text-2xl font-black text-slate-800">{{ records().length }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase">Total Registros</div>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-2xl font-black text-slate-800">{{ verifiedCount() }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase">Certificados por CREV</div>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-2xl font-black text-slate-800">{{ pendingCount() }}</div>
            <div class="text-xs font-bold text-slate-400 uppercase">Pendientes Auditoría</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Causa / Oficio</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cámara</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rango Horario</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Integridad</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Operador</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (record of records(); track record.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-800 truncate max-w-xs group-hover:text-indigo-600 transition-colors">
                      {{ record.description }}
                    </div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{{ record.record_type }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-slate-700">{{ record.camera_name }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-xs font-medium text-slate-600">{{ record.start_time | date:'dd/MM/yy HH:mm' }}</div>
                    <div class="text-xs text-slate-400 lowercase italic">al {{ record.end_time | date:'HH:mm' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    @if (record.is_verified) {
                      <div class="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M2.166 4.9L9.03 17.003a2 2 0 003.443 0l6.863-12.103a2 2 0 00-1.722-2.978H3.888a2 2 0 00-1.722 2.978zm11.473 1.731a1 1 0 10-1.414-1.414l-3.536 3.536-1.414-1.414a1 1 0 00-1.414 1.414l2.121 2.121a1 1 0 001.414 0l4.243-4.243z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-[10px] font-black uppercase">Hasheado</span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                        <span class="text-[10px] font-black uppercase">Pendiente</span>
                      </div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-slate-700">{{ record.operator_name }}</div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-20 text-center">
                    <p class="text-slate-400 italic">No hay registros fílmicos para mostrar.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Record Creation Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div class="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 class="text-xl font-bold text-slate-900">Nuevo Registro de Evidencia</h3>
              <button (click)="showForm.set(false)" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form (ngSubmit)="saveRecord()" #recordForm="ngForm" class="p-8 space-y-6">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descripción / Oficio</label>
                <input type="text" name="description" [(ngModel)]="newRecord.description" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                       placeholder="Ej: Oficio Nro 2026/123 - Juzgado Federal 1">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cámara</label>
                  <select name="camera" [(ngModel)]="newRecord.camera" required
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                    @for (cam of cameras(); track cam.id) {
                      <option [value]="cam.id">{{ cam.name }}</option>
                    }
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Registro</label>
                  <select name="record_type" [(ngModel)]="newRecord.record_type"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                    <option value="VD">VIDEO (VD)</option>
                    <option value="IM">IMAGEN</option>
                    <option value="OT">OTRO</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Inicio Rango</label>
                  <input type="datetime-local" name="start_time" [(ngModel)]="newRecord.start_time" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fin Rango</label>
                  <input type="datetime-local" name="end_time" [(ngModel)]="newRecord.end_time" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Operador Responsable</label>
                <select name="operator" [(ngModel)]="newRecord.operator" required
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                  @for (person of people(); track person.id) {
                    <option [value]="person.id">{{ person.last_name }}, {{ person.first_name }}</option>
                  }
                </select>
              </div>

              <div class="pt-4 flex gap-3">
                <button type="button" (click)="showForm.set(false)"
                        class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all">
                  Cancelar
                </button>
                <button type="submit" [disabled]="!recordForm.form.valid"
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100">
                  Registrar Evidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
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
