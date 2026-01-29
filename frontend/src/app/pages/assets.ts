import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../services/asset.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Sistemas (VMS/NVR)</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-bottom border-slate-100">
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubicación</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (system of systems; track system.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-slate-700">{{ system.name }}</td>
                  <td class="px-6 py-4 text-slate-600">{{ system.location }}</td>
                  <td class="px-6 py-4 text-slate-500 font-mono text-sm">{{ system.ip_address }}</td>
                  <td class="px-6 py-4">
                    <span [class]="system.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'" 
                          class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ system.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-6 py-10 text-center text-slate-400 italic">No se encontraron sistemas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Cámaras Registradas</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-bottom border-slate-100">
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cámara</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolución</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (camera of cameras; track camera.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-slate-700">{{ camera.name }}</td>
                  <td class="px-6 py-4 text-slate-600">{{ camera.system_name || 'N/A' }}</td>
                  <td class="px-6 py-4">
                    <span [ngClass]="{
                      'bg-emerald-100 text-emerald-700': camera.status === 'ONLINE',
                      'bg-rose-100 text-rose-700': camera.status === 'OFFLINE',
                      'bg-amber-100 text-amber-700': camera.status === 'MAINTENANCE'
                    }" class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ camera.status === 'ONLINE' ? 'En Línea' : camera.status === 'OFFLINE' ? 'Fuera de Línea' : 'Mantenimiento' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-500">{{ camera.resolution }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-6 py-10 text-center text-slate-400 italic">No se encontraron cámaras.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  providers: [AssetService]
})
export class AssetsComponent implements OnInit {
  private assetService = inject(AssetService);
  systems: any[] = [];
  cameras: any[] = [];

  ngOnInit() {
    console.log('AssetsComponent: Fetching systems and cameras...');

    this.assetService.getSystems().subscribe({
      next: (data) => {
        console.log('Systems successfully fetched:', data);
        this.systems = data;
      },
      error: (err) => console.error('Error fetching systems:', err)
    });

    this.assetService.getCameras().subscribe({
      next: (data) => {
        console.log('Cameras successfully fetched:', data);
        this.cameras = data;
      },
      error: (err) => console.error('Error fetching cameras:', err)
    });
  }
}
