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
      <div class="flex justify-end items-center">
        <button (click)="openForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          Nueva Novedad
        </button>
      </div>

      <!-- Modal Form -->
      @if (showForm) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 class="text-lg font-bold text-slate-800">{{ isEditing ? 'Editar Novedad' : 'Registrar Nueva Novedad' }}</h3>
              <button (click)="closeForm()" class="text-slate-400 hover:text-slate-600 font-bold text-xl transition-colors">&times;</button>
            </div>
            <form (submit)="saveNovedad($event)" class="p-6 space-y-4">
              
              <!-- Asset Selection -->
              <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Activo</label>
                    <select name="target_type" [(ngModel)]="targetType" (change)="onTargetTypeChange()" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm">
                      <option value="SYSTEM">Sistema / Sitio</option>
                      <option value="SERVER">Servidor</option>
                      <option value="CAMERA">Cámara</option>
                      <option value="GEAR">Equipamiento (Prensa)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Activo Afectado</label>
                    <select name="target_id" [(ngModel)]="selectedAssetId" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm" required>
                      <option value="">Seleccione...</option>
                      @if (targetType === 'SYSTEM') {
                        @for (sys of systems; track sys.id) { <option [value]="sys.id">{{ sys.name }}</option> }
                      }
                      @if (targetType === 'SERVER') {
                        @for (srv of servers; track srv.id) { <option [value]="srv.id">{{ srv.name }} ({{ srv.system_name || 'Sin Sitio' }})</option> }
                      }
                      @if (targetType === 'CAMERA') {
                        @for (cam of cameras; track cam.id) { <option [value]="cam.id">{{ cam.name }}</option> }
                      }
                      @if (targetType === 'GEAR') {
                        @for (item of gear; track item.id) { <option [value]="item.id">{{ item.name }} ({{ item.serial_number }})</option> }
                      }
                    </select>
                  </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descripción</label>
                <textarea name="description" [(ngModel)]="newNovedad.description" rows="3" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm" placeholder="Detalle la novedad..." required></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Severidad</label>
                  <select name="severity" [(ngModel)]="newNovedad.severity" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Incidente</label>
                  <input type="text" name="incident_type" [(ngModel)]="newNovedad.incident_type" class="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm" placeholder="e.g. FALLA_TECNICA">
                </div>
              </div>
              
              <div class="pt-4 flex gap-3">
                <button type="button" (click)="closeForm()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all">Cancelar</button>
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all">
                    {{ isEditing ? 'Actualizar' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Activo Afectado</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Gravedad</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (novedad of novedades; track novedad.id) {
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                    {{ novedad.created_at | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td class="px-6 py-4">
                      <div class="flex flex-col">
                        <span class="font-bold text-slate-700">
                             {{ novedad.camera_name || novedad.server_name || novedad.system_name || novedad.cameraman_gear_name || 'Desconocido' }}
                        </span>
                        <span class="text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-wider">
                            {{ getNovedadTypeLabel(novedad) }}
                        </span>
                      </div>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-rose-100 text-rose-700': novedad.severity === 'CRITICAL' || novedad.severity === 'HIGH',
                      'bg-amber-100 text-amber-700': novedad.severity === 'MEDIUM',
                      'bg-indigo-100 text-indigo-700': novedad.severity === 'LOW'
                    }" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                      {{ novedad.severity }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600">
                    <p class="line-clamp-1 max-w-xs text-sm">{{ novedad.description }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-blue-100 text-blue-700': novedad.status === 'OPEN',
                      'bg-amber-100 text-amber-700': novedad.status === 'IN_PROGRESS',
                      'bg-emerald-100 text-emerald-700': novedad.status === 'CLOSED'
                    }" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                      {{ novedad.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="editNovedad(novedad)" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button (click)="deleteNovedad(novedad.id)" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <p class="italic">No se han registrado novedades.</p>
                    </div>
                  </td>
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
  systems: any[] = [];
  servers: any[] = [];
  cameras: any[] = [];
  gear: any[] = [];

  showForm = false;
  isEditing = false;

  targetType: 'SYSTEM' | 'SERVER' | 'CAMERA' | 'GEAR' = 'CAMERA';
  selectedAssetId: any = '';

  newNovedad: any = this.getEmptyNovedad();

  ngOnInit() {
    this.loadData();
    this.loadAssets();
  }

  loadData() {
    this.novedadService.getNovedades().subscribe({
      next: (data) => this.novedades = data,
      error: (err) => console.error('Error fetching novedades:', err)
    });
  }

  loadAssets() {
    this.assetService.getSystems().subscribe(data => this.systems = data);
    this.assetService.getServers().subscribe(data => this.servers = data);
    this.assetService.getCameras().subscribe(data => this.cameras = data);
    this.assetService.getCameramanGear().subscribe(data => this.gear = data);
  }

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.newNovedad = this.getEmptyNovedad();
    this.targetType = 'CAMERA';
    this.selectedAssetId = '';
  }

  editNovedad(novedad: any) {
    this.isEditing = true;
    this.newNovedad = { ...novedad };
    this.showForm = true;

    // Determine type based on which field is populated
    if (novedad.camera) {
      this.targetType = 'CAMERA';
      this.selectedAssetId = typeof novedad.camera === 'object' ? novedad.camera.id : novedad.camera;
    } else if (novedad.server) {
      this.targetType = 'SERVER';
      this.selectedAssetId = typeof novedad.server === 'object' ? novedad.server.id : novedad.server;
    } else if (novedad.system) {
      this.targetType = 'SYSTEM';
      this.selectedAssetId = typeof novedad.system === 'object' ? novedad.system.id : novedad.system;
    } else if (novedad.cameraman_gear) {
      this.targetType = 'GEAR';
      this.selectedAssetId = typeof novedad.cameraman_gear === 'object' ? novedad.cameraman_gear.id : novedad.cameraman_gear;
    }
  }

  closeForm() {
    this.showForm = false;
    this.newNovedad = this.getEmptyNovedad();
  }

  getEmptyNovedad() {
    return {
      camera: null,
      server: null,
      system: null,
      cameraman_gear: null,
      description: '',
      severity: 'MEDIUM',
      incident_type: 'FALLA_TECNICA',
      reported_by: 'Jonatan D.',
      status: 'OPEN'
    };
  }

  onTargetTypeChange() {
    this.selectedAssetId = ''; // Reset selection when type changes
  }

  saveNovedad(event: Event) {
    event.preventDefault();

    // Map selected asset ID to correct field
    this.newNovedad.camera = null;
    this.newNovedad.server = null;
    this.newNovedad.system = null;
    this.newNovedad.cameraman_gear = null;

    if (this.targetType === 'CAMERA') this.newNovedad.camera = this.selectedAssetId;
    if (this.targetType === 'SERVER') this.newNovedad.server = this.selectedAssetId;
    if (this.targetType === 'SYSTEM') this.newNovedad.system = this.selectedAssetId;
    if (this.targetType === 'GEAR') this.newNovedad.cameraman_gear = this.selectedAssetId;

    const request = this.isEditing
      ? this.novedadService.updateNovedad(this.newNovedad.id, this.newNovedad)
      : this.novedadService.createNovedad(this.newNovedad);

    request.subscribe({
      next: (res) => {
        this.loadData();
        this.closeForm();
      },
      error: (err) => alert('Error al guardar la novedad.')
    });
  }

  deleteNovedad(id: number) {
    if (confirm('¿Está seguro de eliminar esta novedad?')) {
      this.novedadService.deleteNovedad(id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Error al eliminar novedad')
      });
    }
  }

  getNovedadTypeLabel(novedad: any): string {
    if (novedad.camera_name || (novedad.camera && !novedad.cameraman_gear)) return 'CÁMARA'; // logic check
    if (novedad.server_name || (novedad.server && !novedad.cameraman_gear)) return 'SERVIDOR';
    if (novedad.system_name || (novedad.system && !novedad.cameraman_gear)) return 'SISTEMA';
    if (novedad.cameraman_gear_name || (novedad.cameraman_gear)) return 'EQUIPAMIENTO';

    // Improved check:
    if (novedad.camera) return 'CÁMARA';
    if (novedad.server) return 'SERVIDOR';
    if (novedad.system) return 'SISTEMA';
    if (novedad.cameraman_gear) return 'EQUIPAMIENTO';

    return 'GENÉRICO';
  }
}
