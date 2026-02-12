import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../services/asset.service';
import { NovedadService } from '../services/novedad.service';
import { PersonnelService } from '../services/personnel.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
<<<<<<< HEAD
    <div class="space-y-8">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p class="text-slate-500 mt-1">Resumen general del estado operativo del COC.</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- COC Filter -->
          <div class="relative">
            <select [ngModel]="selectedCoc()" (ngModelChange)="selectedCoc.set($event)" 
              class="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium shadow-sm transition-all cursor-pointer hover:border-indigo-300">
=======
<div class="space-y-5">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
           <!-- Title moved to top header -->
        </div>
        <div class="flex items-center gap-2">
          <!-- COC Filter -->
          <div class="relative">
            <select [ngModel]="selectedCoc()" (ngModelChange)="selectedCoc.set($event)" 
              class="appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium shadow-sm transition-all cursor-pointer hover:border-indigo-300">
>>>>>>> dev
              <option value="ALL">Todo el Equipamiento</option>
              @for (system of systems(); track system.id) {
                <option [value]="system.id">{{ system.name }}</option>
              }
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

<<<<<<< HEAD
          <span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
=======
          <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
>>>>>>> dev
            Sistema Operativo
          </span>
        </div>
      </div>

<<<<<<< HEAD
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
=======
<!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
>>>>>>> dev
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
<<<<<<< HEAD
              <p class="text-sm font-medium text-slate-500">Sistemas</p>
              <h3 class="text-2xl font-bold text-slate-800">{{ filteredSystemsCount() }}</h3>
=======
              <p class="text-xs font-medium text-slate-500">Sistemas</p>
              <h3 class="text-xl font-bold text-slate-800">{{ filteredSystemsCount() }}</h3>
>>>>>>> dev
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
=======
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">Servidores</p>
              <h3 class="text-xl font-bold text-slate-800">{{ filteredServersCount() }}</h3>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
>>>>>>> dev
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
<<<<<<< HEAD
              <p class="text-sm font-medium text-slate-500">Cámaras Activas</p>
              <h3 class="text-2xl font-bold text-slate-800">{{ filteredCamerasOnline() }}/{{ filteredCamerasTotal() }}</h3>
=======
              <p class="text-xs font-medium text-slate-500">Cámaras Online</p>
              <h3 class="text-xl font-bold text-slate-800">{{ filteredCamerasOnline() }}/{{ filteredCamerasTotal() }}</h3>
>>>>>>> dev
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-rose-50 rounded-xl text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
=======
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-rose-50 rounded-lg text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
>>>>>>> dev
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
<<<<<<< HEAD
              <p class="text-sm font-medium text-slate-500">Novedades Abiertas</p>
              <h3 class="text-2xl font-bold text-slate-800">{{ stats().openNovedades }}</h3>
=======
              <p class="text-xs font-medium text-slate-500">Fallas Abiertas</p>
              <h3 class="text-xl font-bold text-slate-800">{{ stats().openNovedades }}</h3>
>>>>>>> dev
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
=======
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
>>>>>>> dev
          <div class="flex items-center gap-4">
            <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
<<<<<<< HEAD
              <p class="text-sm font-medium text-slate-500">Personal Activo</p>
=======
              <p class="text-sm font-medium text-slate-500">Personal</p>
>>>>>>> dev
              <h3 class="text-2xl font-bold text-slate-800">{{ stats().personnelActive }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Camera Status Chart -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6">Estado de Cámaras por Sistema</h3>
          <div class="space-y-4">
            @for (system of systems(); track system.id) {
               @if (selectedCoc() === 'ALL' || selectedCoc() == system.id) {
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-medium text-slate-700">{{ system.name }}</span>
                        <span class="text-slate-500">{{ getSystemOnlineCount(system.id) }}/{{ getSystemTotalCount(system.id) }} Online</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" 
                            [style.width.%]="getSystemOnlinePercentage(system.id)"></div>
                    </div>
                </div>
               }
            }
          </div>
        </div>

        <!-- Quick Actions (Moved from Grid) -->
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-slate-800 mb-6">Acciones Rápidas</h3>
           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a routerLink="/novedades" class="group flex items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
              <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="font-bold text-slate-800 text-lg">Reportar</p>
                <p class="text-slate-500 text-sm">Crear novedad</p>
              </div>
            </a>
            
            <a routerLink="/assets" class="group flex items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all">
              <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="font-bold text-slate-800 text-lg">Equipos</p>
                <p class="text-slate-500 text-sm">Ver inventario</p>
              </div>
            </a>
<<<<<<< HEAD
=======

            <a routerLink="/integrity" class="group flex items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-amber-200 transition-all">
              <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 21a11.955 11.955 0 01-9.618-7.016m19.236 0a11.92 11.92 0 00-1.092-3.118m-17.052 3.118A11.92 11.92 0 013.86 10.882m16.248-3.118A11.955 11.955 0 0012 3a11.955 11.955 0 00-8.108 3.118M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="font-bold text-slate-800 text-lg">Integridad</p>
                <p class="text-slate-500 text-sm">Validar hashes</p>
              </div>
            </a>
>>>>>>> dev
          </div>

          <!-- Critical Summary Mini -->
          <div class="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between mt-4">
             <div class="flex items-center gap-3">
                 <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                 <span class="text-rose-700 font-bold">Cámaras Offline</span>
             </div>
             <span class="text-2xl font-bold text-rose-700">{{ filteredCamerasOffline() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  providers: [AssetService, NovedadService, PersonnelService]
})
export class HomeComponent implements OnInit {
  private assetService = inject(AssetService);
  private novedadService = inject(NovedadService);
  private personnelService = inject(PersonnelService);

  // Raw Signals
  systems = signal<any[]>([]);
<<<<<<< HEAD
=======
  servers = signal<any[]>([]);
>>>>>>> dev
  cameras = signal<any[]>([]);
  novedades = signal<any[]>([]);
  people = signal<any[]>([]);

  // Filter Signal
  selectedCoc = signal<string>('ALL');

  // Computed Signals for Filtered Data
  filteredSystemsCount = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.systems().length;
    return this.systems().filter(s => s.id == this.selectedCoc()).length;
  });

<<<<<<< HEAD
  filteredCamerasTotal = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.cameras().length;
    // Assuming camera has system (id) property based on serializer
    // In serializer we saw 'system': 1.
=======
  filteredServersCount = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.servers().length;
    return this.servers().filter(s => s.system == this.selectedCoc()).length;
  });

  filteredCamerasTotal = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.cameras().length;
>>>>>>> dev
    return this.cameras().filter(c => c.system == this.selectedCoc()).length;
  });

  filteredCamerasOnline = computed(() => {
    const list = this.selectedCoc() === 'ALL'
      ? this.cameras()
      : this.cameras().filter(c => c.system == this.selectedCoc());
    return list.filter(c => c.status === 'ONLINE').length;
  });

  filteredCamerasOffline = computed(() => {
    const list = this.selectedCoc() === 'ALL'
      ? this.cameras()
      : this.cameras().filter(c => c.system == this.selectedCoc());
    return list.filter(c => c.status === 'OFFLINE').length;
  });

  stats = computed(() => ({
    openNovedades: this.novedades().filter((n: any) => n.status === 'OPEN').length,
    personnelActive: this.people().filter((p: any) => p.is_active).length,
    // Note: Novedades and Personnel are not filtered by COC/System yet as they might not be directly linked in the simple model, limiting scope to Cameras for now.
    // However, Novedad has 'camera' ID. We could filter that if we wanted.
  }));

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.assetService.getSystems().subscribe(data => this.systems.set(data));
<<<<<<< HEAD
=======
    this.assetService.getServers().subscribe(data => this.servers.set(data));
>>>>>>> dev
    this.assetService.getCameras().subscribe(data => this.cameras.set(data));
    this.novedadService.getNovedades().subscribe(data => this.novedades.set(data));
    this.personnelService.getPeople().subscribe(data => this.people.set(data));
  }

  // Helpers for Chart
  getSystemOnlineCount(systemId: number): number {
    return this.cameras().filter(c => c.system === systemId && c.status === 'ONLINE').length;
  }

  getSystemTotalCount(systemId: number): number {
    return this.cameras().filter(c => c.system === systemId).length;
  }

  getSystemOnlinePercentage(systemId: number): number {
    const total = this.getSystemTotalCount(systemId);
    if (total === 0) return 0;
    return (this.getSystemOnlineCount(systemId) / total) * 100;
  }
}
