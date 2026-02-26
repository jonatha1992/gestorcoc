import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovedadService } from '../../services/novedad.service';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './novedades.html',
  providers: [NovedadService, AssetService]
})
export class NovedadesComponent implements OnInit {
  private novedadService = inject(NovedadService);
  private assetService = inject(AssetService);
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
    });
  }

  openForm() {
    this.showForm = true;
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
  }

  closeForm() {
    this.showForm = false;
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
      }
    });
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
