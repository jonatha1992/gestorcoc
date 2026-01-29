import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonnelService } from '../services/personnel.service';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Gestión de Personal</h2>
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          Alta de Personal
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-bottom border-slate-100">
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Legajo</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (person of people; track person.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-700">{{ person.last_name }}, {{ person.first_name }}</td>
                <td class="px-6 py-4 text-slate-500 font-mono text-sm">{{ person.badge_number }}</td>
                <td class="px-6 py-4 text-slate-600">{{ person.role }}</td>
                <td class="px-6 py-4">
                  <span [ngClass]="person.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'" 
                        class="px-2.5 py-1 rounded-full text-xs font-medium">
                    {{ person.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-10 text-center text-slate-400 italic">No se encontró personal registrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  providers: [PersonnelService]
})
export class PersonnelComponent implements OnInit {
  private personnelService = inject(PersonnelService);
  people: any[] = [];

  ngOnInit() {
    console.log('PersonnelComponent: Fetching people...');
    this.personnelService.getPeople().subscribe({
      next: (data) => {
        console.log('People successfully fetched:', data);
        this.people = data;
      },
      error: (err) => console.error('Error fetching people:', err)
    });
  }
}
