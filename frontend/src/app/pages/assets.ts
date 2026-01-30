import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../services/asset.service';
import { LoadingService } from '../services/loading.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Stats Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold shadow-sm">
            {{ systems.length }} Sistemas
          </span>
          <span class="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold shadow-sm">
            {{ totalServers }} Servidores
          </span>
          <span class="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold shadow-sm">
            {{ totalCameras }} Cámaras
          </span>
          <button (click)="refreshData()" class="ml-2 p-2.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-full transition-all active:scale-95" title="Recargar Inventario">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>


      
      @if (error) {
        <div class="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="font-medium">{{ error }}</span>
            </div>
            <button (click)="refreshData()" class="px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors">Reintentar</button>
        </div>
      }

      <!-- Tabs -->
      <div class="flex items-center justify-between border-b border-slate-200">
        <div class="flex">
            <button (click)="activeTab = 'cctv'" 
                [class.border-indigo-500]="activeTab === 'cctv'"
                [class.text-indigo-600]="activeTab === 'cctv'"
                class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-indigo-600 transition-colors">
                CCTV & Servidores
            </button>
            <button (click)="activeTab = 'gear'"
                [class.border-indigo-500]="activeTab === 'gear'"
                [class.text-indigo-600]="activeTab === 'gear'"
                class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-indigo-600 transition-colors flex items-center gap-2">
                Equipamiento de Prensa
                <span class="bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full">{{ gear.length }}</span>
            </button>
        </div>
        
        @if (activeTab === 'gear') {
            <button (click)="openGearModal()" class="mr-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Nuevo Equipo
            </button>
        }
      </div>

      <!-- CCTV Content -->
      @if (activeTab === 'cctv') {
      <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        @for (system of systems; track system.id) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
            <!-- System Header (Clickable) -->
            <div (click)="toggleSystem(system.id)" class="bg-slate-50/80 hover:bg-slate-100 cursor-pointer px-6 py-4 border-b border-slate-100 flex items-center justify-between transition-colors select-none">
              <div class="flex items-center gap-4">
                 <!-- Chevron -->
                <svg class="w-5 h-5 text-slate-400 transition-transform duration-300" [class.rotate-180]="isSystemExpanded(system.id)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                  {{ system.system_type === 'CCTV' ? 'C' : 'N' }}
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-800">{{ system.name }}</h2>
                  <div class="flex items-center gap-4 text-xs text-slate-500 font-medium mt-0.5">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {{ system.location }}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>
                      {{ system.servers?.length || 0 }} Servidores
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {{ system.camera_count }} Cámaras
                    </span>
                  </div>
                </div>
              </div>
              <span [class]="system.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'" 
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border">
                {{ system.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <!-- Content (Collapsible) -->
            @if (isSystemExpanded(system.id)) {
                <div class="p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                <div class="grid grid-cols-1 gap-4">
                    @for (server of system.servers; track server.id) {
                    <div class="border border-slate-200 rounded-xl overflow-hidden">
                        <!-- Server Sub-Header (Clickable) -->
                        <div (click)="toggleServer(server.id)" class="bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer px-4 py-3 border-b border-slate-100 flex items-center justify-between transition-colors select-none">
                            <div class="flex items-center gap-3">
                                <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" [class.rotate-180]="isServerExpanded(server.id)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>
                                <span class="font-bold text-slate-700 text-sm">{{ server.name }}</span>
                                <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-300">{{ server.ip_address }}</span>
                            </div>
                            <span class="text-xs font-semibold text-slate-500">{{ server.cameras?.length }} Cámaras</span>
                        </div>

                        <!-- Cameras (Collapsible) -->
                         @if (isServerExpanded(server.id)) {
                            <div class="overflow-x-auto bg-white animate-in slide-in-from-top-1 duration-150">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                                    <tr>
                                        <th class="px-4 py-2">Nombre</th>
                                        <th class="px-4 py-2">IP</th>
                                        <th class="px-4 py-2">Resolución</th>
                                        <th class="px-4 py-2 text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                @for (camera of server.cameras; track camera.id) {
                                    <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="px-4 py-2 font-medium text-slate-700 w-1/3">
                                        <div class="flex items-center gap-2">
                                        <div [class]="camera.status === 'ONLINE' ? 'bg-emerald-500 shadow-emerald-200 shadow-sm' : 'bg-rose-500 shadow-rose-200 shadow-sm'" class="w-2 h-2 rounded-full"></div>
                                        {{ camera.name }}
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 text-slate-500 font-mono text-xs">{{ camera.ip_address }}</td>
                                    <td class="px-4 py-2 text-slate-600 text-xs">{{ camera.resolution }}</td>
                                    <td class="px-4 py-2 text-right">
                                        <span [class]="camera.status === 'ONLINE' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'" 
                                            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border">
                                        {{ camera.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE' }}
                                        </span>
                                    </td>
                                    </tr>
                                }
                                </tbody>
                            </table>
                            </div>
                         }
                    </div>
                    }
                </div>
                </div>
            }
          </div>
        } @empty {
          <div class="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-slate-200">
             <p class="text-slate-400 italic font-medium">No se encontraron sistemas configurados.</p>
          </div>
        }
      </div>
      }

      <!-- Gear Content -->
      @if (activeTab === 'gear') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Equipo</th>
                            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Serial</th>
                            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Asignado a</th>
                            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Estado</th>
                            <th class="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        @for (item of gear; track item.id) {
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                        </div>
                                        <span class="font-bold text-slate-800">{{ item.name }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 font-mono text-slate-600 text-xs">{{ item.serial_number || '-' }}</td>
                                <td class="px-6 py-4">
                                    @if(item.assigned_to) {
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            {{ item.assigned_to }}
                                        </span>
                                    } @else {
                                        <span class="text-slate-400 italic">No asignado</span>
                                    }
                                </td>
                                <td class="px-6 py-4">
                                    <span [class]="getConditionClass(item.condition)" class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                        {{ getConditionLabel(item.condition) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button (click)="editGear(item)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button (click)="deleteGear(item)" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        } @empty {
                            <tr>
                                <td colspan="5" class="px-6 py-12 text-center text-slate-400 italic">
                                    No hay equipamiento registrado.
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
      }

      <!-- Modal -->
      @if (showGearModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">{{ currentGear.id ? 'Editar' : 'Nuevo' }} Equipo</h3>
                    <button (click)="closeGearModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nombre del Equipo</label>
                        <input [(ngModel)]="currentGear.name" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Ej: Cámara Sony A7">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Número de Serie</label>
                        <input [(ngModel)]="currentGear.serial_number" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm" placeholder="S/N...">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                        <select [(ngModel)]="currentGear.condition" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                            <option value="NEW">Nuevo</option>
                            <option value="GOOD">Bueno</option>
                            <option value="FAIR">Regular</option>
                            <option value="POOR">Malo</option>
                            <option value="BROKEN">Roto</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Asignado a (Opcional)</label>
                         <input [(ngModel)]="currentGear.assigned_to" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nombre del responsable">
                    </div>
                </div>

                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button (click)="closeGearModal()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                    <button (click)="saveGear()" [disabled]="!currentGear.name" class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
      }
    </div>
  `,
  providers: [AssetService]
})
export class AssetsComponent implements OnInit {
  private assetService = inject(AssetService);
  loadingService = inject(LoadingService);
  systems: any[] = [];
  gear: any[] = [];
  totalCameras = 0;
  totalServers = 0;
  error: string | null = null;
  activeTab: 'cctv' | 'gear' = 'cctv';

  expandedSystemIds = new Set<number>();
  expandedServerIds = new Set<number>();

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    // this.isLoading = true;
    this.loadingService.show();
    this.error = null;

    // ForkJoin or separate calls? Let's do separate for now or chained.
    // Ideally use forkJoin from RxJS but let's keep it simple.

    this.assetService.getSystems().subscribe({
      next: (data) => {
        this.systems = data;
        this.totalCameras = data.reduce((acc: number, sys: any) => acc + (sys.camera_count || 0), 0);
        this.totalServers = data.reduce((acc: number, sys: any) => acc + (sys.servers?.length || 0), 0);

        // Fetch Gear
        this.assetService.getCameramanGear().subscribe({
          next: (gearData) => {
            this.gear = gearData;
            this.loadingService.hide();
          },
          error: (err) => {
            console.error('Error fetching gear:', err);
            this.loadingService.hide();
            // Don't block main view if gear fails
          }
        });
      },
      error: (err) => {
        console.error('AssetsComponent: Error fetching systems:', err);
        this.error = 'No se pudieron cargar los datos.';
        this.loadingService.hide();
      }
    });
  }

  toggleSystem(id: number) {
    if (this.expandedSystemIds.has(id)) {
      this.expandedSystemIds.delete(id);
    } else {
      this.expandedSystemIds.add(id);
    }
  }

  isSystemExpanded(id: number): boolean {
    return this.expandedSystemIds.has(id);
  }

  toggleServer(id: number) {
    if (this.expandedServerIds.has(id)) {
      this.expandedServerIds.delete(id);
    } else {
      this.expandedServerIds.add(id);
    }
  }

  isServerExpanded(id: number): boolean {
    return this.expandedServerIds.has(id);
  }

  // Gear CRUD Logic
  showGearModal = false;
  currentGear: any = {};
  toastService = inject(ToastService);

  openGearModal() {
    this.currentGear = { condition: 'GOOD' }; // Default
    this.showGearModal = true;
  }

  editGear(item: any) {
    this.currentGear = { ...item };
    this.showGearModal = true;
  }

  closeGearModal() {
    this.showGearModal = false;
    this.currentGear = {};
  }

  saveGear() {
    this.loadingService.show();

    if (this.currentGear.id) {
      // Update
      this.assetService.updateCameramanGear(this.currentGear.id, this.currentGear).subscribe({
        next: () => {
          this.toastService.success('Equipo actualizado');
          this.refreshData();
          this.closeGearModal();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Error al actualizar equipo');
          this.loadingService.hide();
        }
      });
    } else {
      // Create
      this.assetService.createCameramanGear(this.currentGear).subscribe({
        next: () => {
          this.toastService.success('Equipo creado');
          this.refreshData();
          this.closeGearModal();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Error al crear equipo');
          this.loadingService.hide();
        }
      });
    }
  }

  deleteGear(item: any) {
    if (!confirm(`¿Estás seguro de eliminar ${item.name}?`)) return;

    this.loadingService.show();
    this.assetService.deleteCameramanGear(item.id).subscribe({
      next: () => {
        this.toastService.success('Equipo eliminado');
        this.refreshData();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Error al eliminar equipo');
        this.loadingService.hide();
      }
    });
  }

  getConditionLabel(code: string): string {
    const map: any = { 'NEW': 'Nuevo', 'GOOD': 'Bueno', 'FAIR': 'Regular', 'POOR': 'Malo', 'BROKEN': 'Roto' };
    return map[code] || code;
  }

  getConditionClass(code: string): string {
    const map: any = {
      'NEW': 'bg-emerald-100 text-emerald-700',
      'GOOD': 'bg-emerald-100 text-emerald-700',
      'FAIR': 'bg-yellow-100 text-yellow-700',
      'POOR': 'bg-orange-100 text-orange-700',
      'BROKEN': 'bg-rose-100 text-rose-700'
    };
    return map[code] || 'bg-slate-100 text-slate-700';
  }
}
