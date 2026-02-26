import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../../services/asset.service';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { forkJoin } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assets.html',
  providers: [AssetService]
})
export class AssetsComponent implements OnInit {
  private assetService = inject(AssetService);
  private apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  systems: any[] = [];
  units: any[] = [];
  groupedSystems: { unitId: number, unitName: string, unitCode: string, systems: any[] }[] = [];
  gear: any[] = [];
  totalCameras = 0;
  totalServers = 0;
  error: string | null = null;
  activeTab: 'cctv' | 'gear' = 'cctv';
  isLoadingCctv = false;
  isLoadingGear = false;

  expandedSystemIds = new Set<number>();
  expandedServerIds = new Set<number>();

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.isLoadingCctv = true;
    this.isLoadingGear = true;
    this.loadingService.show();
    this.error = null;

    forkJoin({
      systems: this.assetService.getSystems(),
      units: this.apiService.get<any[]>('api/units/'),
      gear: this.assetService.getCameramanGear()
    }).pipe(
      timeout(30000)
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

        this.isLoadingCctv = false;
        this.isLoadingGear = false;
        this.loadingService.hide();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading assets:', err);
        this.error = 'No se pudieron cargar los datos. Verifique la conexión al servidor.';
        this.toastService.error('Error al cargar los datos');
        this.isLoadingCctv = false;
        this.isLoadingGear = false;
        this.loadingService.hide();
        this.cdr.detectChanges();
      }
    });
  }

  groupSystems() {
    const groups: { [id: number]: any } = {};

    // Units that are not "top-level" (parents) but actually COCs
    const cocUnits = this.units.filter(u => u.parent !== null || u.code !== 'CREV');

    this.systems.forEach(sys => {
      const unit = sys.unit;

      // Si no tiene unidad, crear un grupo "Sin Unidad"
      if (!unit) {
        const noUnitKey = -1; // Key especial para sistemas sin unidad
        if (!groups[noUnitKey]) {
          groups[noUnitKey] = {
            unitId: noUnitKey,
            unitName: 'Sin Unidad Asignada',
            unitCode: 'N/A',
            systems: []
          };
        }
        groups[noUnitKey].systems.push(sys);
        return;
      }

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
