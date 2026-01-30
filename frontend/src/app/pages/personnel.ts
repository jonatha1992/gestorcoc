import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/personnel.service';
import { AssetService } from '../services/asset.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500">
      <div class="flex justify-end items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <button (click)="openForm()" 
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
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Unidad / Sistemas</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (person of people(); track person.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group" [class.opacity-50]="!person.is_active" [class.grayscale]="!person.is_active">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 uppercase relative">
                        {{ person.first_name[0] }}{{ person.last_name[0] }}
                         @if (!person.is_active) {
                            <div class="absolute -bottom-1 -right-1 bg-slate-500 text-white rounded-full p-0.5 border-2 border-white" title="Inactivo">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </div>
                         }
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
                    <div class="text-sm text-slate-600 italic font-medium mb-1">{{ person.unit || 'Sin Unidad' }}</div>
                    <div class="flex flex-wrap gap-1">
                      @for (sys of person.assigned_systems_details; track sys.id) {
                        <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 uppercase">
                          {{ sys.name }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {{ person.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="toggleActive(person)" class="p-2 rounded-lg transition-colors" [class.text-emerald-600]="!person.is_active" [class.hover:bg-emerald-50]="!person.is_active" [class.text-amber-600]="person.is_active" [class.hover:bg-amber-50]="person.is_active" [title]="person.is_active ? 'Desactivar' : 'Activar'">
                            @if (person.is_active) {
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            } @else {
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            }
                        </button>
                        <button (click)="editPerson(person)" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                             <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button (click)="deletePerson(person.id)" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar Permanentemente">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-10 text-center text-slate-400 italic">No hay personal registrado.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Creation/Edit Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 class="text-xl font-bold text-slate-900">{{ isEditing ? 'Editar Personal' : 'Nueva Alta de Personal' }}</h3>
              <button (click)="closeForm()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form (ngSubmit)="savePerson()" #personForm="ngForm" class="p-8 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" name="first_name" [(ngModel)]="currentPerson.first_name" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                  <input type="text" name="last_name" [(ngModel)]="currentPerson.last_name" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Legajo</label>
                  <input type="text" name="badge_number" [(ngModel)]="currentPerson.badge_number" required
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold font-mono">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jerarquía</label>
                  <input type="text" name="rank" [(ngModel)]="currentPerson.rank"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unidad</label>
                    <select name="unit" [(ngModel)]="currentPerson.unit"
                           class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                      @for (u of units; track u.code) {
                        <option [value]="u.code">{{ u.name }}</option>
                      }
                    </select>
                  </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rol</label>
                  <select name="role" [(ngModel)]="currentPerson.role"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium">
                    <option value="OPERATOR">OPERADOR</option>
                    <option value="SUPERVISOR">FISCALIZADOR (CREV)</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>
              
              <!-- System Selection -->
              <div class="space-y-2">
                 <label class="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sistemas Asignados</label>
                 <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                    @for (sys of systems(); track sys.id) {
                        <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                            <input type="checkbox" [checked]="isSystemSelected(sys.id)" (change)="toggleSystem(sys.id)" class="rounded text-indigo-600 focus:ring-indigo-500">
                            <span class="text-sm font-medium text-slate-700">{{ sys.name }}</span>
                        </label>
                    }
                 </div>
              </div>

              <div class="pt-4 flex gap-3">
                <button type="button" (click)="closeForm()"
                        class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all">
                  Cancelar
                </button>
                <button type="submit" [disabled]="!personForm.form.valid"
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100">
                  {{ isEditing ? 'Actualizar' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  providers: [PersonnelService, AssetService]
})
export class PersonnelComponent implements OnInit {
  private personnelService = inject(PersonnelService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);

  people = signal<any[]>([]);
  systems = signal<any[]>([]);
  showForm = signal(false);
  isEditing = false;

  units = [
    { code: 'AEP', name: 'Aeroparque' },
    { code: 'EZE', name: 'Ezeiza' },
    { code: 'FDO', name: 'San Fernando' },
    { code: 'BHI', 'name': 'Bahía Blanca' },
    { code: 'MDQ', name: 'Mar del Plata' }
  ];

  currentPerson: any = this.getEmptyPerson();

  ngOnInit() {
    this.loadPeople();
    this.loadSystems();
  }

  loadPeople() {
    this.personnelService.getPeople().subscribe({
      next: (data) => this.people.set(data),
      error: (err) => console.error('Error fetching people:', err)
    });
  }

  loadSystems() {
    this.assetService.getSystems().subscribe({
      next: (data) => this.systems.set(data),
      error: (err) => console.error('Error fetching systems:', err)
    });
  }

  getEmptyPerson() {
    return {
      first_name: '',
      last_name: '',
      badge_number: '',
      role: 'OPERATOR',
      rank: '',
      unit: 'AEP',
      guard_group: '',
      is_active: true,
      assigned_systems: []
    };
  }

  openForm() {
    this.isEditing = false;
    this.currentPerson = this.getEmptyPerson();
    this.showForm.set(true);
  }

  editPerson(person: any) {
    this.isEditing = true;
    // Copy object to avoid reference issues, map assigned_systems IDs
    this.currentPerson = {
      ...person,
      assigned_systems: person.assigned_systems_details ? person.assigned_systems_details.map((s: any) => s.id) : []
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.currentPerson = this.getEmptyPerson();
  }

  isSystemSelected(systemId: number): boolean {
    return this.currentPerson.assigned_systems?.includes(systemId);
  }

  toggleSystem(systemId: number) {
    const current = this.currentPerson.assigned_systems || [];
    if (current.includes(systemId)) {
      this.currentPerson.assigned_systems = current.filter((id: number) => id !== systemId);
    } else {
      this.currentPerson.assigned_systems = [...current, systemId];
    }
  }

  toggleActive(person: any) {
    const updatedPerson = { ...person, is_active: !person.is_active };
    this.personnelService.updatePerson(person.id, updatedPerson).subscribe({
      next: () => {
        this.toastService.show(updatedPerson.is_active ? 'Personal activado' : 'Personal desactivado', 'success');
        this.loadPeople();
      },
      error: (err) => this.toastService.show('Error al cambiar estado', 'error')
    });
  }

  deletePerson(id: number) {
    if (confirm('ADVERTENCIA: ¿Está seguro de eliminar permanentemente a este usuario? Esta acción no se puede deshacer.')) {
      this.personnelService.deletePerson(id).subscribe({
        next: () => {
          this.toastService.show('Personal eliminado correctamente', 'success');
          this.loadPeople();
        },
        error: (err) => this.toastService.show('Error al eliminar usuario', 'error')
      });
    }
  }

  savePerson() {
    const request = this.isEditing
      ? this.personnelService.updatePerson(this.currentPerson.id, this.currentPerson)
      : this.personnelService.createPerson(this.currentPerson);

    request.subscribe({
      next: (res) => {
        this.toastService.show(this.isEditing ? 'Personal actualizado' : 'Personal registrado', 'success');
        this.closeForm();
        this.loadPeople();
      },
      error: (err) => {
        console.error('Error saving person:', err);
        this.toastService.show('Error al guardar personal', 'error');
      }
    });
  }
}
