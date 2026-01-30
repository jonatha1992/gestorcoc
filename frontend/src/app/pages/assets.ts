import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../services/asset.service';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';
import { forkJoin } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';

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
        
        @if (activeTab === 'cctv') {
            <button (click)="openSystemModal()" class="mr-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Nuevo Sistema
            </button>
        } @else {
            <button (click)="openGearModal()" class="mr-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Nuevo Equipo
            </button>
        }
      </div>

      <!-- CCTV Content -->
      @if (activeTab === 'cctv') {
      <div class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        @if (isLoadingCctv) {
          <div class="flex flex-col items-center justify-center p-12 space-y-4">
            <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p class="text-slate-500 font-medium animate-pulse">Cargando sistemas...</p>
          </div>
        } @else {
          @for (unitGroup of groupedSystems; track unitGroup.unitId) {
          <div class="space-y-4">
            <div class="flex items-center gap-2 px-2">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">{{ unitGroup.unitName }} ({{ unitGroup.unitCode }})</h3>
              <div class="h-px bg-slate-200 flex-grow ml-2"></div>
            </div>

            @for (system of unitGroup.systems; track system.id) {
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                <!-- System Header (Clickable) -->
                <div class="bg-slate-50/80 hover:bg-slate-100 px-6 py-4 border-b border-slate-100 flex items-center justify-between transition-colors select-none group">
                  <div (click)="toggleSystem(system.id)" class="flex items-center gap-4 cursor-pointer flex-grow">
                     <!-- Chevron -->
                    <svg class="w-5 h-5 text-slate-400 transition-transform duration-300" [class.rotate-180]="isSystemExpanded(system.id)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    
                    <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                      {{ system.system_type === 'CCTV' ? 'C' : 'N' }}
                    </div>
                    <div>
                      <h2 class="text-lg font-bold text-slate-800">{{ system.name }}</h2>
                      <div class="flex items-center gap-4 text-xs text-slate-500 font-medium mt-0.5">
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
                  
                  <div class="flex items-center gap-3">
                    <span [class]="system.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'" 
                          class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border">
                      {{ system.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button (click)="editSystem(system)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button (click)="deleteSystem(system)" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                </div>

                <!-- Content (Collapsible) -->
                @if (isSystemExpanded(system.id)) {
                    <div class="p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                      <div class="flex justify-between items-center mb-4">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Infraestructura del Sistema</h4>
                        <button (click)="openServerModal(system.id)" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                          Nuevo Servidor
                        </button>
                      </div>
                      <div class="grid grid-cols-1 gap-4">
                          @for (server of system.servers; track server.id) {
                          <div class="border border-slate-200 rounded-xl overflow-hidden group/server">
                              <!-- Server Sub-Header (Clickable) -->
                              <div class="bg-slate-50/50 hover:bg-slate-100/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between transition-colors select-none">
                                  <div (click)="toggleServer(server.id)" class="flex items-center gap-3 cursor-pointer flex-grow">
                                      <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" [class.rotate-180]="isServerExpanded(server.id)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                                      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>
                                      <span class="font-bold text-slate-700 text-sm">{{ server.name }}</span>
                                      <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-300">{{ server.ip_address }}</span>
                                  </div>
                                  <div class="flex items-center gap-4">
                                    <div class="flex items-center gap-1 opacity-0 group-hover/server:opacity-100 transition-opacity">
                                      <button (click)="editServer(server)" class="p-1 text-slate-400 hover:text-indigo-600"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                      <button (click)="deleteServer(server)" class="p-1 text-slate-400 hover:text-rose-600"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                    <span class="text-xs font-semibold text-slate-500">{{ server.cameras?.length }} Cámaras</span>
                                  </div>
                              </div>

                              <!-- Cameras (Collapsible) -->
                               @if (isServerExpanded(server.id)) {
                                  <div class="overflow-x-auto bg-white animate-in slide-in-from-top-1 duration-150">
                                  <div class="p-3 bg-slate-50/30 border-b border-slate-100 flex justify-end">
                                    <button (click)="openCameraModal(server.id)" class="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                                      Nuevas Cámaras
                                    </button>
                                  </div>
                                  <table class="w-full text-left text-xs">
                                      <thead class="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-bold tracking-wider border-b border-slate-100">
                                          <tr>
                                              <th class="px-4 py-2">Nombre</th>
                                              <th class="px-4 py-2 text-center">Res</th>
                                              <th class="px-4 py-2 text-right">Acciones</th>
                                          </tr>
                                      </thead>
                                      <tbody class="divide-y divide-slate-50">
                                      @for (camera of server.cameras; track camera.id) {
                                          <tr class="hover:bg-slate-50 transition-colors group/cam">
                                          <td class="px-4 py-2 font-medium text-slate-700">
                                              <div class="flex items-center gap-2">
                                              <div [class]="camera.status === 'ONLINE' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'" class="w-1.5 h-1.5 rounded-full"></div>
                                              {{ camera.name }}
                                              <span class="text-[9px] text-slate-400 font-mono">{{ camera.ip_address }}</span>
                                              </div>
                                          </td>
                                          <td class="px-4 py-2 text-slate-500 text-center">{{ camera.resolution }}</td>
                                          <td class="px-4 py-2 text-right">
                                              <div class="flex items-center justify-end gap-1 opacity-0 group-hover/cam:opacity-100 transition-opacity">
                                                <button (click)="editCamera(camera)" class="p-1 text-slate-400 hover:text-indigo-600"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                <button (click)="deleteCamera(camera)" class="p-1 text-slate-400 hover:text-rose-600"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                              </div>
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
            }
          </div>
          }
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

      <!-- Modals (CCTV) -->
      @if (showSystemModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">{{ currentSystem.id ? 'Editar' : 'Nuevo' }} Sistema</h3>
                    <button (click)="closeSystemModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input [(ngModel)]="currentSystem.name" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ej: Milestone AEP">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                        <select [(ngModel)]="currentSystem.unit_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                            @for (unit of units; track unit.id) {
                                <option [value]="unit.id">{{ unit.name }} ({{ unit.code }})</option>
                            }
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <input [(ngModel)]="currentSystem.is_active" type="checkbox" id="sys-active" class="w-4 h-4 text-indigo-600 rounded">
                        <label for="sys-active" class="text-sm font-medium text-slate-700">Activo</label>
                    </div>
                </div>
                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button (click)="closeSystemModal()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button (click)="saveSystem()" class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Guardar</button>
                </div>
            </div>
        </div>
      }

      @if (showServerModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">{{ currentServer.id ? 'Editar' : 'Nuevo' }} Servidor</h3>
                    <button (click)="closeServerModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input [(ngModel)]="currentServer.name" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ej: SRV-01">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">IP</label>
                        <input [(ngModel)]="currentServer.ip_address" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" placeholder="10.x.y.z">
                    </div>
                </div>
                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button (click)="closeServerModal()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button (click)="saveServer()" class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Guardar</button>
                </div>
            </div>
        </div>
      }

      @if (showCameraModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">{{ currentCamera.id ? 'Editar' : 'Nuevas' }} Cámaras</h3>
                    <button (click)="closeCameraModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input [(ngModel)]="currentCamera.name" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ej: CAM-01">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">IP</label>
                        <input [(ngModel)]="currentCamera.ip_address" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" placeholder="10.x.y.z">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Resolución</label>
                        <input [(ngModel)]="currentCamera.resolution" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ej: 1080p">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                        <select [(ngModel)]="currentCamera.status" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                            <option value="ONLINE">ONLINE</option>
                            <option value="OFFLINE">OFFLINE</option>
                            <option value="MAINTENANCE">Mantenimiento</option>
                        </select>
                    </div>
                </div>
                <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button (click)="closeCameraModal()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button (click)="saveCamera()" class="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Guardar</button>
                </div>
            </div>
        </div>
      }
  `,
  providers: [AssetService]
})
export class AssetsComponent implements OnInit {
  private assetService = inject(AssetService);
  private apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  systems: any[] = [];
  units: any[] = [];
  groupedSystems: { unitId: number, unitName: string, unitCode: string, systems: any[] }[] = [];
  gear: any[] = [];
  totalCameras = 0;
  totalServers = 0;
  error: string | null = null;
  activeTab: 'cctv' | 'gear' = 'cctv';
  isLoadingCctv = false;

  expandedSystemIds = new Set<number>();
  expandedServerIds = new Set<number>();

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.isLoadingCctv = true;
    this.loadingService.show();
    this.error = null;

    forkJoin({
      systems: this.assetService.getSystems(),
      units: this.apiService.get<any[]>('api/units/'),
      gear: this.assetService.getCameramanGear()
    }).pipe(
      timeout(15000), // Timeout after 15 seconds
      finalize(() => {
        this.isLoadingCctv = false;
        this.loadingService.hide();
      })
    ).subscribe({
      next: (results) => {
        // Process Systems
        if (results.systems) {
          this.systems = results.systems;
          this.totalCameras = this.systems.reduce((acc: number, sys: any) => acc + (sys.camera_count || 0), 0);
          this.totalServers = this.systems.reduce((acc: number, sys: any) => acc + (sys.servers?.length || 0), 0);
        }

        // Process Units
        if (results.units) {
          this.units = results.units;
          this.groupSystems();
        }

        // Process Gear
        if (results.gear) {
          this.gear = results.gear;
        }
      },
      error: (err) => {
        console.error('Error loading assets:', err);
        this.error = 'No se pudieron cargar los datos. Verifique la conexión.';
      }
    });
  }

  groupSystems() {
    const groups: { [id: number]: any } = {};

    // Units that are not "top-level" (parents) but actually COCs
    const cocUnits = this.units.filter(u => u.parent !== null || u.code !== 'CREV');

    this.systems.forEach(sys => {
      const unit = sys.unit;
      if (!unit) return;

      if (!groups[unit.id]) {
        groups[unit.id] = {
          unitId: unit.id,
          unitName: unit.name,
          unitCode: unit.code,
          systems: []
        };
      }
      groups[unit.id].systems.push(sys);
    });

    this.groupedSystems = Object.values(groups);
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

  // System CRUD
  showSystemModal = false;
  currentSystem: any = {};

  openSystemModal() {
    this.currentSystem = { is_active: true };
    this.showSystemModal = true;
  }

  editSystem(sys: any) {
    this.currentSystem = { ...sys, unit_id: sys.unit?.id };
    this.showSystemModal = true;
  }

  closeSystemModal() {
    this.showSystemModal = false;
    this.currentSystem = {};
  }

  saveSystem() {
    this.loadingService.show();
    const obs = this.currentSystem.id ?
      this.assetService.updateSystem(this.currentSystem.id, this.currentSystem) :
      this.assetService.createSystem(this.currentSystem);

    obs.subscribe({
      next: () => {
        this.toastService.success(this.currentSystem.id ? 'Sistema actualizado' : 'Sistema creado');
        this.refreshData();
        this.closeSystemModal();
      },
      error: () => {
        this.toastService.error('Error al guardar sistema');
        this.loadingService.hide();
      }
    });
  }

  deleteSystem(sys: any) {
    if (!confirm(`¿Eliminar sistema ${sys.name}?`)) return;
    this.loadingService.show();
    this.assetService.deleteSystem(sys.id).subscribe({
      next: () => {
        this.toastService.success('Sistema eliminado');
        this.refreshData();
      },
      error: () => {
        this.toastService.error('Error al eliminar sistema');
        this.loadingService.hide();
      }
    });
  }

  // Server CRUD
  showServerModal = false;
  currentServer: any = {};

  openServerModal(systemId: number) {
    this.currentServer = { system: systemId, is_active: true };
    this.showServerModal = true;
  }

  editServer(srv: any) {
    this.currentServer = { ...srv };
    this.showServerModal = true;
  }

  closeServerModal() {
    this.showServerModal = false;
    this.currentServer = {};
  }

  saveServer() {
    this.loadingService.show();
    const obs = this.currentServer.id ?
      this.assetService.updateServer(this.currentServer.id, this.currentServer) :
      this.assetService.createServer(this.currentServer);

    obs.subscribe({
      next: () => {
        this.toastService.success('Servidor guardado');
        this.refreshData();
        this.closeServerModal();
      },
      error: () => {
        this.toastService.error('Error al guardar servidor');
        this.loadingService.hide();
      }
    });
  }

  deleteServer(srv: any) {
    if (!confirm(`¿Eliminar servidor ${srv.name}?`)) return;
    this.loadingService.show();
    this.assetService.deleteServer(srv.id).subscribe({
      next: () => {
        this.toastService.success('Servidor eliminado');
        this.refreshData();
      },
      error: () => {
        this.toastService.error('Error al eliminar servidor');
        this.loadingService.hide();
      }
    });
  }

  // Camera CRUD
  showCameraModal = false;
  currentCamera: any = {};

  openCameraModal(serverId: number) {
    this.currentCamera = { server: serverId, status: 'ONLINE' };
    this.showCameraModal = true;
  }

  editCamera(cam: any) {
    this.currentCamera = { ...cam };
    this.showCameraModal = true;
  }

  closeCameraModal() {
    this.showCameraModal = false;
    this.currentCamera = {};
  }

  saveCamera() {
    this.loadingService.show();
    const obs = this.currentCamera.id ?
      this.assetService.updateCamera(this.currentCamera.id, this.currentCamera) :
      this.assetService.createCamera(this.currentCamera);

    obs.subscribe({
      next: () => {
        this.toastService.success('Cámara guardada');
        this.refreshData();
        this.closeCameraModal();
      },
      error: () => {
        this.toastService.error('Error al guardar cámara');
        this.loadingService.hide();
      }
    });
  }

  deleteCamera(cam: any) {
    if (!confirm(`¿Eliminar cámara ${cam.name}?`)) return;
    this.loadingService.show();
    this.assetService.deleteCamera(cam.id).subscribe({
      next: () => {
        this.toastService.success('Cámara eliminada');
        this.refreshData();
      },
      error: () => {
        this.toastService.error('Error al eliminar cámara');
        this.loadingService.hide();
      }
    });
  }

  // Gear CRUD Logic
  showGearModal = false;
  currentGear: any = {};

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
