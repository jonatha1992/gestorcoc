<<<<<<< HEAD
import { Component, OnInit, inject } from '@angular/core';
=======
import { Component, OnInit, inject, HostListener } from '@angular/core';
>>>>>>> dev
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovedadService } from '../services/novedad.service';
import { AssetService } from '../services/asset.service';
<<<<<<< HEAD
=======
import { ToastService } from '../services/toast.service';
>>>>>>> dev

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
<<<<<<< HEAD
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-slate-800">Registro de Novedades</h2>
=======
      <div class="flex justify-end items-center">
>>>>>>> dev
        <button (click)="openForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          Nueva Novedad
        </button>
      </div>

<<<<<<< HEAD
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
=======
      <!-- Modal Form -->
      @if (showForm) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 class="text-lg font-bold text-slate-800">{{ isEditing ? 'Editar Novedad' : 'Registrar Nueva Novedad' }}</h3>
              <button (click)="closeForm()" class="text-slate-400 hover:text-slate-600 font-bold text-xl transition-colors">&times;</button>
            </div>
            <form (submit)="saveNovedad($event)" class="p-8 space-y-6">
              
              <!-- Asset Selection -->
              <div class="grid grid-cols-2 gap-6">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Tipo de Activo</label>
                    <select name="target_type" [(ngModel)]="targetType" (change)="onTargetTypeChange()" class="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm">
                      <option value="SYSTEM">Sistema / Sitio</option>
                      <option value="SERVER">Servidor</option>
                      <option value="CAMERA">Cámara</option>
                      <option value="GEAR">Equipamiento (Prensa)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Activos Afectados</label>
                    
                    <!-- Selected assets as chips -->
                    @if (selectedAssets.length > 0) {
                      <div class="flex flex-wrap gap-2 mb-3">
                        @for (asset of selectedAssets; track asset.id) {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                            {{ asset.name }}
                            <button type="button" (click)="removeAsset(asset.id)" class="hover:bg-indigo-200 rounded-full p-0.5 transition-colors">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        }
                      </div>
                    }
                    
                    <!-- Search input with dropdown -->
                    <div class="relative">
                      <input 
                        type="text" 
                        name="target_search" 
                        [(ngModel)]="searchText"
                        (input)="filterAssets(); showDropdown = true"
                        (focus)="showDropdown = true"
                        (blur)="onSearchBlur()"
                        class="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm" 
                        placeholder="Buscar y agregar activos..."
                        autocomplete="off">
                      
                      <!-- Custom dropdown -->
                      @if (showDropdown && filteredAssets.length > 0) {
                        <div class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          @for (asset of filteredAssets; track asset.id) {
                            <button
                              type="button"
                              (click)="addAsset(asset)"
                              [disabled]="isAssetSelected(asset.id)"
                              class="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between">
                              <div>
                                <div class="font-semibold text-slate-700">{{ asset.name }}</div>
                                @if (targetType === 'SERVER' && asset.system_name) {
                                  <div class="text-xs text-slate-400">{{ asset.system_name }}</div>
                                }
                                @if (targetType === 'GEAR' && asset.serial_number) {
                                  <div class="text-xs text-slate-400">{{ asset.serial_number }}</div>
                                }
                              </div>
                              @if (isAssetSelected(asset.id)) {
                                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                              }
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Descripción</label>
                <textarea name="description" [(ngModel)]="newNovedad.description" rows="4" class="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm" placeholder="Detalle la novedad..." required></textarea>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Severidad</label>
                  <select name="severity" [(ngModel)]="newNovedad.severity" class="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm">
>>>>>>> dev
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
<<<<<<< HEAD
                  <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de Incidente</label>
                  <input type="text" name="incident_type" [(ngModel)]="newNovedad.incident_type" class="w-full rounded-lg border-slate-200" placeholder="e.g. FALLA_TECNICA">
                </div>
              </div>
              <div class="pt-4 flex justify-end gap-3">
                <button type="button" (click)="closeForm()" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
                <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">Guardar Novedad</button>
=======
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Tipo de Incidente</label>
                  <input type="text" name="incident_type" [(ngModel)]="newNovedad.incident_type" class="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm" placeholder="e.g. FALLA_TECNICA">
                </div>
              </div>
              
              <div class="pt-6 flex gap-4">
                <button type="button" (click)="closeForm()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 px-6 rounded-xl transition-all">Cancelar</button>
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-100 transition-all">
                    {{ isEditing ? 'Actualizar' : 'Guardar' }}
                </button>
>>>>>>> dev
              </div>
            </form>
          </div>
        </div>
      }

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
<<<<<<< HEAD
              <tr class="bg-slate-50 border-bottom border-slate-100">
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cámara</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gravedad</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
=======
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Activo Afectado</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Gravedad</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
>>>>>>> dev
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (novedad of novedades; track novedad.id) {
<<<<<<< HEAD
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {{ novedad.created_at | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-700">{{ novedad.camera_name || 'Cámara #' + novedad.camera }}</td>
=======
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
>>>>>>> dev
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-rose-100 text-rose-700': novedad.severity === 'CRITICAL' || novedad.severity === 'HIGH',
                      'bg-amber-100 text-amber-700': novedad.severity === 'MEDIUM',
                      'bg-indigo-100 text-indigo-700': novedad.severity === 'LOW'
<<<<<<< HEAD
                    }" class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ novedad.severity }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600">
                    <p class="line-clamp-1 max-w-xs">{{ novedad.description }}</p>
=======
                    }" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                      {{ getSeverityLabel(novedad.severity) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600">
                    <p class="line-clamp-1 max-w-xs text-sm">{{ novedad.description }}</p>
>>>>>>> dev
                  </td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-blue-100 text-blue-700': novedad.status === 'OPEN',
                      'bg-amber-100 text-amber-700': novedad.status === 'IN_PROGRESS',
                      'bg-emerald-100 text-emerald-700': novedad.status === 'CLOSED'
<<<<<<< HEAD
                    }" class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ novedad.status === 'OPEN' ? 'Abierta' : novedad.status === 'IN_PROGRESS' ? 'En Progreso' : 'Cerrada' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="deleteNovedad(novedad.id)" class="text-rose-600 hover:text-rose-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
=======
                    }" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                      {{ novedad.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button (click)="editNovedad(novedad)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button (click)="deleteNovedad(novedad.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
>>>>>>> dev
                  </td>
                </tr>
              } @empty {
                <tr>
<<<<<<< HEAD
                  <td colspan="6" class="px-6 py-10 text-center text-slate-400 italic">No se encontraron novedades registradas.</td>
=======
                  <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <p class="italic">No se han registrado novedades.</p>
                    </div>
                  </td>
>>>>>>> dev
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
<<<<<<< HEAD

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
=======
  private toastService = inject(ToastService);

  novedades: any[] = [];
  systems: any[] = [];
  servers: any[] = [];
  cameras: any[] = [];
  gear: any[] = [];

  filteredAssets: any[] = [];
  searchText: string = '';

  showForm = false;
  isEditing = false;

  targetType: 'SYSTEM' | 'SERVER' | 'CAMERA' | 'GEAR' = 'CAMERA';
  selectedAssets: any[] = [];
  showDropdown = false;

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
    this.assetService.getSystems().subscribe(data => {
      this.systems = data;
      if (this.targetType === 'SYSTEM') this.filterAssets();
    });
    this.assetService.getServers().subscribe(data => {
      this.servers = data;
      if (this.targetType === 'SERVER') this.filterAssets();
    });
    this.assetService.getCameras().subscribe(data => {
      this.cameras = data;
      if (this.targetType === 'CAMERA') this.filterAssets();
    });
    this.assetService.getCameramanGear().subscribe(data => {
      this.gear = data;
      if (this.targetType === 'GEAR') this.filterAssets();
>>>>>>> dev
    });
  }

  openForm() {
    this.showForm = true;
<<<<<<< HEAD
=======
    this.isEditing = false;
    this.newNovedad = this.getEmptyNovedad();
    this.targetType = 'CAMERA';
    this.selectedAssets = [];
    this.searchText = '';
    this.showDropdown = false;
    this.filterAssets();
  }

  editNovedad(novedad: any) {
    this.isEditing = true;
    this.newNovedad = { ...novedad };
    this.showForm = true;
    this.selectedAssets = [];

    // Determine type based on which field is populated and load the asset
    if (novedad.camera) {
      this.targetType = 'CAMERA';
      const cameraId = typeof novedad.camera === 'object' ? novedad.camera.id : novedad.camera;
      const camera = this.cameras.find(c => c.id === cameraId);
      if (camera) this.selectedAssets = [camera];
      this.searchText = novedad.camera_name || '';
    } else if (novedad.server) {
      this.targetType = 'SERVER';
      const serverId = typeof novedad.server === 'object' ? novedad.server.id : novedad.server;
      const server = this.servers.find(s => s.id === serverId);
      if (server) this.selectedAssets = [server];
      this.searchText = novedad.server_name ? `${novedad.server_name} (${novedad.system_name || 'Sin Sitio'})` : '';
    } else if (novedad.system) {
      this.targetType = 'SYSTEM';
      const systemId = typeof novedad.system === 'object' ? novedad.system.id : novedad.system;
      const system = this.systems.find(s => s.id === systemId);
      if (system) this.selectedAssets = [system];
      this.searchText = novedad.system_name || '';
    } else if (novedad.cameraman_gear) {
      this.targetType = 'GEAR';
      const gearId = typeof novedad.cameraman_gear === 'object' ? novedad.cameraman_gear.id : novedad.cameraman_gear;
      const gearItem = this.gear.find(g => g.id === gearId);
      if (gearItem) this.selectedAssets = [gearItem];
      this.searchText = novedad.cameraman_gear_name || '';
    }

    this.filterAssets();
>>>>>>> dev
  }

  closeForm() {
    this.showForm = false;
<<<<<<< HEAD
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
=======
    this.searchText = '';
    this.selectedAssets = [];
    this.showDropdown = false;
    this.isEditing = false;
    this.newNovedad = this.getEmptyNovedad();
    this.targetType = 'CAMERA';
    this.filteredAssets = [];
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
    this.selectedAssets = [];
    this.searchText = '';
    this.showDropdown = false;
    this.filterAssets();
  }

  filterAssets() {
    let source: any[] = [];

    if (this.targetType === 'SYSTEM') source = this.systems;
    else if (this.targetType === 'SERVER') source = this.servers;
    else if (this.targetType === 'CAMERA') source = this.cameras;
    else if (this.targetType === 'GEAR') source = this.gear;

    if (!this.searchText) {
      this.filteredAssets = source.slice(0, 50); // Show first 50
    } else {
      const search = this.searchText.toLowerCase();
      this.filteredAssets = source.filter((item: any) =>
        item.name?.toLowerCase().includes(search) ||
        item.serial_number?.toLowerCase().includes(search) ||
        item.system_name?.toLowerCase().includes(search)
      ).slice(0, 50);
    }
  }

  addAsset(asset: any) {
    if (!this.isAssetSelected(asset.id)) {
      this.selectedAssets.push(asset);
      this.searchText = '';
      this.showDropdown = false;
      this.filterAssets();
    }
  }

  removeAsset(assetId: number) {
    this.selectedAssets = this.selectedAssets.filter(a => a.id !== assetId);
  }

  isAssetSelected(assetId: number): boolean {
    return this.selectedAssets.some(a => a.id === assetId);
  }

  onSearchBlur() {
    // Delay to allow click events on dropdown items to fire first
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  saveNovedad(event: Event) {
    event.preventDefault();

    // Validate that at least one asset is selected
    if (this.selectedAssets.length === 0) {
      this.toastService.error('Debe seleccionar al menos un activo afectado');
      return;
    }

    // Create novedad data from form
    const baseData = {
      description: this.newNovedad.description,
      severity: this.newNovedad.severity,
      incident_type: this.newNovedad.incident_type,
      reported_by: this.newNovedad.reported_by,
      status: this.newNovedad.status
    };

    if (this.isEditing) {
      // For edit mode, update the existing novedad (single asset only)
      const payload: any = { ...baseData };

      // Set the appropriate asset field based on targetType
      if (this.targetType === 'CAMERA') payload.camera = this.selectedAssets[0].id;
      else if (this.targetType === 'SERVER') payload.server = this.selectedAssets[0].id;
      else if (this.targetType === 'SYSTEM') payload.system = this.selectedAssets[0].id;
      else if (this.targetType === 'GEAR') payload.cameraman_gear = this.selectedAssets[0].id;

      this.novedadService.updateNovedad(this.newNovedad.id, payload).subscribe({
        next: () => {
          this.toastService.success('Novedad actualizada correctamente');
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          console.error('Error al actualizar novedad:', err);
          this.toastService.error('Error al actualizar la novedad');
        }
      });
    } else {
      // For create mode, create one novedad per selected asset
      let createCount = 0;
      const totalAssets = this.selectedAssets.length;

      this.selectedAssets.forEach((asset, index) => {
        const payload: any = { ...baseData };

        // Set the appropriate asset field based on targetType
        if (this.targetType === 'CAMERA') payload.camera = asset.id;
        else if (this.targetType === 'SERVER') payload.server = asset.id;
        else if (this.targetType === 'SYSTEM') payload.system = asset.id;
        else if (this.targetType === 'GEAR') payload.cameraman_gear = asset.id;

        this.novedadService.createNovedad(payload).subscribe({
          next: () => {
            createCount++;
            if (createCount === totalAssets) {
              this.toastService.success(
                totalAssets === 1
                  ? 'Novedad registrada correctamente'
                  : `Se crearon ${totalAssets} novedades correctamente`
              );
              this.closeForm();
              this.loadData();
            }
          },
          error: (err) => {
            console.error('Error al crear novedad:', err);
            this.toastService.error(`Error al crear novedad para ${asset.name}`);
          }
        });
      });
    }
  }

  getSeverityLabel(severity: string): string {
    const severityMap: any = {
      'LOW': 'Baja',
      'MEDIUM': 'Media',
      'HIGH': 'Alta',
      'CRITICAL': 'Crítica'
    };
    return severityMap[severity] || severity;
  }

  deleteNovedad(id: number) {
    if (!confirm('¿Está seguro de eliminar esta novedad?')) {
      return;
    }

    this.novedadService.deleteNovedad(id).subscribe({
      next: () => {
        this.toastService.success('Novedad eliminada correctamente');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al eliminar novedad:', err);
        this.toastService.error('Error al eliminar la novedad');
>>>>>>> dev
      }
    });
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> dev
  }
}
