import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovedadService } from '../services/novedad.service';
import { AssetService } from '../services/asset.service';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Registro de Novedades</h2>
        <button (click)="openForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          Nueva Novedad
        </button>
      </div>

      <!-- Modal Form (Simple Overlay) -->
      @if (showForm) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 class="text-lg font-bold text-slate-800">Registrar Nueva Novedad</h3>
              <button (click)="closeForm()" class="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <form (submit)="saveNovedad($event)" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Cámara</label>
                <select name="camera" [(ngModel)]="newNovedad.camera" class="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" required>
                  <option value="">Seleccione una cámara...</option>
                  @for (cam of cameras; track cam.id) {
                    <option [value]="cam.id">{{ cam.name }} ({{ cam.system_name }})</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea name="description" [(ngModel)]="newNovedad.description" rows="3" class="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Detalle la novedad..." required></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Severidad</label>
                  <select name="severity" [(ngModel)]="newNovedad.severity" class="w-full rounded-lg border-slate-200">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de Incidente</label>
                  <input type="text" name="incident_type" [(ngModel)]="newNovedad.incident_type" class="w-full rounded-lg border-slate-200" placeholder="e.g. FALLA_TECNICA">
                </div>
              </div>
              <div class="pt-4 flex justify-end gap-3">
                <button type="button" (click)="closeForm()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
                <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">Guardar Novedad</button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-bottom border-slate-100">
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cámara</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gravedad</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (novedad of novedades; track novedad.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {{ novedad.created_at | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-700">{{ novedad.camera_name || 'Cámara #' + novedad.camera }}</td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-rose-100 text-rose-700': novedad.severity === 'CRITICAL' || novedad.severity === 'HIGH',
                      'bg-amber-100 text-amber-700': novedad.severity === 'MEDIUM',
                      'bg-indigo-100 text-indigo-700': novedad.severity === 'LOW'
                    }" class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ novedad.severity }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600">
                    <p class="line-clamp-1 max-w-xs">{{ novedad.description }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-blue-100 text-blue-700': novedad.status === 'OPEN',
                      'bg-amber-100 text-amber-700': novedad.status === 'IN_PROGRESS',
                      'bg-emerald-100 text-emerald-700': novedad.status === 'CLOSED'
                    }" class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ novedad.status === 'OPEN' ? 'Abierta' : novedad.status === 'IN_PROGRESS' ? 'En Progreso' : 'Cerrada' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="deleteNovedad(novedad.id)" class="text-rose-600 hover:text-rose-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-10 text-center text-slate-400 italic">No se encontraron novedades registradas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  providers: [NovedadService, AssetService]
})
export class NovedadesComponent implements OnInit {
  private novedadService = inject(NovedadService);
  private assetService = inject(AssetService);

  novedades: any[] = [];
  cameras: any[] = [];
  showForm = false;

  newNovedad = {
    camera: '',
    description: '',
    severity: 'MEDIUM',
    incident_type: 'FALLA_TECNICA',
    reported_by: 'Jonatan D.'
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    console.log('NovedadesComponent: Loading data...');
    this.novedadService.getNovedades().subscribe({
      next: (data: any[]) => {
        console.log('Novedades successfully fetched:', data);
        this.novedades = data;
      },
      error: (err: any) => console.error('Error fetching novedades:', err)
    });

    this.assetService.getCameras().subscribe({
      next: (data: any[]) => {
        console.log('Cameras fetched for form:', data);
        this.cameras = data;
      },
      error: (err: any) => console.error('Error fetching cameras for form:', err)
    });
  }

  openForm() {
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.newNovedad = {
      camera: '',
      description: '',
      severity: 'MEDIUM',
      incident_type: 'FALLA_TECNICA',
      reported_by: 'Jonatan D.'
    };
  }

  saveNovedad(event: Event) {
    event.preventDefault();
    console.log('Saving novedad:', this.newNovedad);
    this.novedadService.createNovedad(this.newNovedad).subscribe({
      next: (res: any) => {
        console.log('Novedad saved correctly:', res);
        this.loadData();
        this.closeForm();
      },
      error: (err: any) => {
        console.error('Error saving novedad:', err);
        alert('Error al guardar la novedad. Verifique los datos.');
      }
    });
  }

  deleteNovedad(id: number) {
    if (confirm('¿Está seguro de eliminar esta novedad?')) {
      this.novedadService.deleteNovedad(id).subscribe({
        next: () => {
          console.log('Novedad deleted:', id);
          this.loadData();
        },
        error: (err: any) => console.error('Error deleting novedad:', err)
      });
    }
  }
}
