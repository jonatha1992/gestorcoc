import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/personnel.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Personal</h2>
          <p class="text-slate-500 text-sm mt-1">Administración de operadores y fiscalizadores del COC.</p>
        </div>
        <button (click)="showForm.set(true)" 
                class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Alta de Personal
        </button>
      </div>

      <!-- Main Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Personal</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Legajo / Jerarquía</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Unidad / Guardia</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (person of people(); track person.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 uppercase">
                        {{ person.first_name[0] }}{{ person.last_name[0] }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                          {{ person.last_name }}, {{ person.first_name }}
                        </div>
                        <div class="text-[11px] text-slate-400 font-medium uppercase tracking-tighter">{{ person.role }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-slate-700 font-mono text-sm font-semibold">{{ person.badge_number }}</div>
                    <div class="text-xs text-slate-400">{{ person.rank || 'Sin rango' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-slate-600 italic font-medium">{{ person.unit || '-' }}</div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase">{{ person.guard_group || 'No asignada' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {{ person.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span [ngClass]="person.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'" 
                          class="px-3 py-1 rounded-full text-[11px] font-bold border">
                      {{ person.is_active ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center">
                      <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p class="text-slate-400 italic font-medium text-lg">No se encontró personal registrado.</p>
                      <button (click)="showForm.set(true)" class="mt-4 text-indigo-600 font-bold hover:underline">Agregar el primero</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Creation Modal Overlay -->
      @if (showForm()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div class="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 class="text-xl font-bold text-slate-900">Nueva Alta de Personal</h3>
              <button (click)="showForm.set(false)" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form (ngSubmit)="savePerson()" #personForm="ngForm" class="p-8 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" name="first_name" [(ngModel)]="newPerson.first_name" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                         placeholder="Ej: Juan">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                  <input type="text" name="last_name" [(ngModel)]="newPerson.last_name" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                         placeholder="Ej: Pérez">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Legajo</label>
                  <input type="text" name="badge_number" [(ngModel)]="newPerson.badge_number" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold font-mono"
                         placeholder="Ej: 5123">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jerarquía</label>
                  <input type="text" name="rank" [(ngModel)]="newPerson.rank"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                         placeholder="Ej: Oficial Principal">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unidad</label>
                  <input type="text" name="unit" [(ngModel)]="newPerson.unit"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                         placeholder="Ej: COC Ezeiza">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rol</label>
                  <select name="role" [(ngModel)]="newPerson.role"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                    <option value="OPERATOR">OPERADOR</option>
                    <option value="SUPERVISOR">FISCALIZADOR (CREV)</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>

              <div class="pt-4 flex gap-3">
                <button type="button" (click)="showForm.set(false)"
                        class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all">
                  Cancelar
                </button>
                <button type="submit" [disabled]="!personForm.form.valid"
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100">
                  Guardar Personal
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  providers: [PersonnelService]
})
export class PersonnelComponent implements OnInit {
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);

  people = signal<any[]>([]);
  showForm = signal(false);

  newPerson: any = {
    first_name: '',
    last_name: '',
    badge_number: '',
    role: 'OPERATOR',
    rank: '',
    unit: '',
    guard_group: '',
    is_active: true
  };

  ngOnInit() {
    this.loadPeople();
  }

  loadPeople() {
    this.personnelService.getPeople().subscribe({
      next: (data) => this.people.set(data),
      error: (err) => {
        console.error('Error fetching people:', err);
        this.toastService.show('Error al cargar personal', 'error');
      }
    });
  }

  savePerson() {
    this.personnelService.createPerson(this.newPerson).subscribe({
      next: (res) => {
        this.toastService.show('Personal registrado exitosamente', 'success');
        this.showForm.set(false);
        this.resetForm();
        this.loadPeople();
      },
      error: (err) => {
        console.error('Error saving person:', err);
        this.toastService.show('Error al guardar personal', 'error');
      }
    });
  }

  resetForm() {
    this.newPerson = {
      first_name: '',
      last_name: '',
      badge_number: '',
      role: 'OPERATOR',
      rank: '',
      unit: '',
      guard_group: '',
      is_active: true
    };
  }
}
