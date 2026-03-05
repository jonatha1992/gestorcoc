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

  globalSearchText: string = '';
  searchText: string = ''; // For asset search in modal

  get filteredNovedades() {
    const search = this.globalSearchText.toLowerCase();
    const allNovedades = this.novedades;
    if (!search) return allNovedades;

    return allNovedades.filter(n =>
      n.title?.toLowerCase().includes(search) ||
      n.description?.toLowerCase().includes(search) ||
      n.camera_name?.toLowerCase().includes(search) ||
      n.system_name?.toLowerCase().includes(search) ||
      n.server_name?.toLowerCase().includes(search) ||
      n.gear_name?.toLowerCase().includes(search) ||
      n.status?.toLowerCase().includes(search) ||
      n.severity?.toLowerCase().includes(search)
    );
  }

  filteredAssets: any[] = [];
  // searchText: string = ''; // This line is removed as searchText is now a signal

  showForm = false;
  isEditing = false;

  showActaModal = false;
  actaForm = {
    numero: '',
    grado: '',
    nombre: '',
    aeropuerto: '',
    hora: '',
    firma: ''
  };

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
    setTimeout(() => {
      this.selectedAssets = [];
      this.searchText = '';
      this.showDropdown = false;
      this.filterAssets();
    });
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

      this.selectedAssets.forEach((asset) => {
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
            this.toastService.error(`Error al crear novedad para ${asset.name} `);
          }
        });
      });
    }
  }

  openActaModal() {
    const saved = localStorage.getItem('acta_responsable');
    if (saved) {
      const p = JSON.parse(saved);
      this.actaForm.grado = p.grado || '';
      this.actaForm.nombre = p.nombre || '';
      this.actaForm.aeropuerto = p.aeropuerto || '';
      this.actaForm.firma = p.firma || '';
    }
    const now = new Date();
    this.actaForm.hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.actaForm.numero = '';
    this.showActaModal = true;
  }

  closeActaModal() {
    this.showActaModal = false;
  }

  async generateActa() {
    localStorage.setItem('acta_responsable', JSON.stringify({
      grado: this.actaForm.grado,
      nombre: this.actaForm.nombre,
      aeropuerto: this.actaForm.aeropuerto,
      firma: this.actaForm.firma
    }));
    const logoBase64 = await this.getLogoBase64();
    const html = this.buildActaHtml(logoBase64);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acta_novedades_${this.actaForm.numero || 'sin_numero'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.success('Acta generada correctamente');
    this.showActaModal = false;
  }

  private async getLogoBase64(): Promise<string> {
    try {
      const response = await fetch('/Logo-PSA.png');
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { return ''; }
  }

  private buildActaHtml(logoBase64: string): string {
    const now = new Date();
    const [hh, mm] = this.actaForm.hora.split(':');
    const day = now.getDate().toString().padStart(2, '0');
    const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const groups = this.filteredNovedades.reduce((acc, n) => {
      const key = n.incident_type || 'SIN CLASIFICAR';
      if (!acc[key]) acc[key] = [];
      acc[key].push(n.camera_name || n.server_name || n.system_name || n.cameraman_gear_name || 'Desconocido');
      return acc;
    }, {} as Record<string, string[]>);

    const sectionsHtml = Object.entries(groups).map(([type, assets]) => `
      <h2>${this.escapeHtml(type)}</h2>
      <ul>
        ${(assets as string[]).map(a => `<li>${this.escapeHtml(a)}</li>`).join('')}
      </ul>
    `).join('');

    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" width="120" alt="Logo PSA" style="margin-bottom: 10px;">`
      : '';

    const firmaHtml = this.actaForm.firma && this.actaForm.firma.startsWith('data:image')
      ? `<img src="${this.actaForm.firma}" style="max-height: 80px; display: block; margin: 0 auto 5px auto;" />`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 2.5cm 3cm; }
  body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; text-align: justify; }
  h1 { font-size: 14pt; text-align: center; text-decoration: underline; font-weight: bold; }
  h2 { font-size: 12pt; text-decoration: underline; font-weight: bold; margin-top: 20pt; }
  ul { margin-left: 20pt; }
  li { margin-bottom: 4pt; }
  .intro { text-indent: 1.5cm; }
  .footer { text-align: center; margin-top: 50px; }
</style>
</head>
<body>
  <div style="text-align: left;">${logoHtml}</div>

  <h1>ACTA DEJANDO CONSTANCIA Nro. ${this.escapeHtml(this.actaForm.numero)}</h1>

  <p class="intro">En el aeropuerto Internacional ${this.escapeHtml(this.actaForm.aeropuerto)}, asiento del Centro Operativo
  de Control ${this.escapeHtml(this.actaForm.aeropuerto)}, a los ${day} días del mes de ${month} del
  año ${year}, siendo las ${this.escapeHtml(hh || '00')}:${this.escapeHtml(mm || '00')} horas, el funcionario que suscribe,
  ${this.escapeHtml(this.actaForm.grado)} ${this.escapeHtml(this.actaForm.nombre)}, responsable del Turno COC ${this.escapeHtml(this.actaForm.aeropuerto)}, labra la
  presente acta dejando constancia de las novedades registradas durante el turno:</p>

  ${sectionsHtml}

  <p><strong>ES TODO CONSTE----------------------------------------------------------------------</strong></p>

  <div class="footer">
    ${logoHtml}
    ${firmaHtml}
    <p><strong>${this.escapeHtml(this.actaForm.grado)} ${this.escapeHtml(this.actaForm.nombre)}</strong></p>
    <p>RESPONSABLE TURNO COC</p>
    <p>UOSP ${this.escapeHtml(this.actaForm.aeropuerto).toUpperCase()}</p>
  </div>
</body>
</html>`;
  }

  onFirmaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => { this.actaForm.firma = reader.result as string; };
      reader.readAsDataURL(input.files[0]);
    }
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
