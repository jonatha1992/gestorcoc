import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovedadService } from '../../services/novedad.service';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PermissionCodes } from '../../auth/auth.models';
import { environment } from '../../../environments/environment';
import {
  getFirstDayOfCurrentMonthInputValue,
  getTodayDateInputValue,
} from '../../utils/date-inputs';

type NovedadSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type NovedadStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
type NovedadAssetType = 'CAMERA' | 'SERVER' | 'SYSTEM' | 'GEAR' | 'UNKNOWN';
type TargetType = 'SYSTEM' | 'SERVER' | 'CAMERA' | 'GEAR';

interface NovedadViewModel {
  id: number;
  created_at: string;
  updated_at?: string;
  camera: number | null;
  server: number | null;
  system: number | null;
  cameraman_gear: number | null;
  camera_name: string;
  server_name: string;
  system_name: string;
  cameraman_gear_name: string;
  severity: NovedadSeverity;
  status: NovedadStatus;
  incident_type: string;
  reported_by: string;
  description: string;
  assetLabel: string;
  assetType: NovedadAssetType;
  [key: string]: any;
}

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './novedades.html',
  providers: [NovedadService, AssetService],
})
export class NovedadesComponent implements OnInit {
  private novedadService = inject(NovedadService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  @ViewChild('sigPad') sigPad!: ElementRef<HTMLCanvasElement>;

  novedades: NovedadViewModel[] = [];
  systems: any[] = [];
  servers: any[] = [];
  cameras: any[] = [];
  gear: any[] = [];
  isLoadingTable = false;

  // Pagination
  currentPage = 1;
  totalCount = 0;
  pageSize = 50;
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  // Filters
  searchText = '';
  filterStatus = '';
  filterSeverity = '';
  filterIncidentType = '';
  filterAssetType = '';
  filterDateFrom = getFirstDayOfCurrentMonthInputValue();
  filterDateTo = getTodayDateInputValue();
  filterReportedBy = '';
  private searchTimer: any;

  // Asset search in modal
  assetSearchText = '';
  filteredAssets: any[] = [];

  showForm = false;
  isEditing = false;

  showActaModal = false;
  actaForm = {
    numero: '',
    grado: '',
    nombre: '',
    aeropuerto: '',
    hora: '',
    firma: '',
  };

  actaTargetNovedades: any[] | null = null;

  private sigDrawing = false;
  private sigCtx: CanvasRenderingContext2D | null = null;

  targetType: TargetType = 'CAMERA';
  previousTargetType: TargetType = 'CAMERA';
  selectedAssets: any[] = [];
  selectedAssetsByType: Record<TargetType, any[]> = this.getEmptySelectedAssetsByType();
  showDropdown = false;
  generateActaAfterSave = false;

  newNovedad: any = this.getEmptyNovedad();

  get canManageNovedades(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_NOVEDADES);
  }

  private requireManageNovedades(): boolean {
    if (this.canManageNovedades) {
      return true;
    }
    this.toastService.error('No tiene permiso para modificar novedades.');
    return false;
  }

  ngOnInit() {
    this.loadData();
    this.loadAssets();
  }

  loadData() {
    this.isLoadingTable = true;
    this.novedadService
      .getNovedades(this.currentPage, {
        search: this.searchText || undefined,
        status: this.filterStatus || undefined,
        severity: this.filterSeverity || undefined,
        incident_type: this.filterIncidentType || undefined,
        asset_type: (this.filterAssetType as any) || undefined,
        created_at__gte: this.toStartOfDayIso(this.filterDateFrom),
        created_at__lte: this.toEndOfDayIso(this.filterDateTo),
        reported_by: this.filterReportedBy || undefined,
      })
      .subscribe({
        next: (data: any) => {
          const rawRows = data?.results ?? data ?? [];
          const normalizedRows = (Array.isArray(rawRows) ? rawRows : []).map((row: any) =>
            this.normalizeNovedadRow(row),
          );
          this.logNovedadShapeWarnings(normalizedRows);
          this.novedades = normalizedRows;
          this.totalCount = data?.count ?? normalizedRows.length;
          this.isLoadingTable = false;
        },
        error: (err) => {
          console.error('Error fetching novedades:', err);
          this.novedades = [];
          this.totalCount = 0;
          this.isLoadingTable = false;
        },
      });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadData();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const current = this.currentPage;
    const pages: number[] = [1];
    if (current > 3) pages.push(-1); // ellipsis
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1); // ellipsis
    pages.push(total);
    return pages;
  }

  loadAssets() {
    this.assetService.getSystems().subscribe((data) => {
      this.systems = (data as any)?.results ?? data;
      if (this.targetType === 'SYSTEM') this.filterAssets();
    });
    this.assetService.getServers().subscribe((data) => {
      this.servers = (data as any)?.results ?? data;
      if (this.targetType === 'SERVER') this.filterAssets();
    });
    this.assetService.getCameras().subscribe((data) => {
      this.cameras = (data as any)?.results ?? data;
      if (this.targetType === 'CAMERA') this.filterAssets();
    });
    this.assetService.getCameramanGear().subscribe((data) => {
      this.gear = (data as any)?.results ?? data;
      if (this.targetType === 'GEAR') this.filterAssets();
    });
  }

  openForm() {
    if (!this.requireManageNovedades()) {
      return;
    }
    this.showForm = true;
    this.isEditing = false;
    this.newNovedad = this.getEmptyNovedad();
    this.targetType = 'CAMERA';
    this.previousTargetType = this.targetType;
    this.selectedAssetsByType = this.getEmptySelectedAssetsByType();
    this.selectedAssets = [];
    this.assetSearchText = '';
    this.showDropdown = false;
    this.generateActaAfterSave = false;
    this.filterAssets();
  }

  editNovedad(novedad: any) {
    if (!this.requireManageNovedades()) {
      return;
    }
    this.isEditing = true;
    this.newNovedad = { ...novedad };
    this.showForm = true;
    this.generateActaAfterSave = false;
    this.selectedAssetsByType = this.getEmptySelectedAssetsByType();
    this.selectedAssets = [];

    if (novedad.camera) {
      this.targetType = 'CAMERA';
      const cameraId = typeof novedad.camera === 'object' ? novedad.camera.id : novedad.camera;
      const camera = this.cameras.find((c) => c.id === cameraId);
      if (camera) this.selectedAssets = [camera];
      this.assetSearchText = novedad.camera_name || '';
    } else if (novedad.server) {
      this.targetType = 'SERVER';
      const serverId = typeof novedad.server === 'object' ? novedad.server.id : novedad.server;
      const server = this.servers.find((s) => s.id === serverId);
      if (server) this.selectedAssets = [server];
      this.assetSearchText = novedad.server_name
        ? `${novedad.server_name} (${novedad.system_name || 'Sin Sitio'})`
        : '';
    } else if (novedad.system) {
      this.targetType = 'SYSTEM';
      const systemId = typeof novedad.system === 'object' ? novedad.system.id : novedad.system;
      const system = this.systems.find((s) => s.id === systemId);
      if (system) this.selectedAssets = [system];
      this.assetSearchText = novedad.system_name || '';
    } else if (novedad.cameraman_gear) {
      this.targetType = 'GEAR';
      const gearId =
        typeof novedad.cameraman_gear === 'object'
          ? novedad.cameraman_gear.id
          : novedad.cameraman_gear;
      const gearItem = this.gear.find((g) => g.id === gearId);
      if (gearItem) this.selectedAssets = [gearItem];
      this.assetSearchText = novedad.cameraman_gear_name || '';
    }

    this.previousTargetType = this.targetType;
    this.selectedAssetsByType[this.targetType] = [...this.selectedAssets];

    this.filterAssets();
  }

  closeForm() {
    this.showForm = false;
    this.assetSearchText = '';
    this.selectedAssets = [];
    this.selectedAssetsByType = this.getEmptySelectedAssetsByType();
    this.showDropdown = false;
    this.isEditing = false;
    this.generateActaAfterSave = false;
    this.newNovedad = this.getEmptyNovedad();
    this.targetType = 'CAMERA';
    this.previousTargetType = this.targetType;
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
      status: 'OPEN',
    };
  }

  getEmptySelectedAssetsByType(): Record<TargetType, any[]> {
    return {
      SYSTEM: [],
      SERVER: [],
      CAMERA: [],
      GEAR: [],
    };
  }

  onTargetTypeChange() {
    this.selectedAssetsByType[this.previousTargetType] = [...this.selectedAssets];
    this.selectedAssets = [...this.selectedAssetsByType[this.targetType]];
    this.previousTargetType = this.targetType;
    this.assetSearchText = '';
    this.showDropdown = false;
    this.filterAssets();
  }

  filterAssets() {
    let source: any[] = [];
    if (this.targetType === 'SYSTEM') source = this.systems;
    else if (this.targetType === 'SERVER') source = this.servers;
    else if (this.targetType === 'CAMERA') source = this.cameras;
    else if (this.targetType === 'GEAR') source = this.gear;

    if (!this.assetSearchText) {
      this.filteredAssets = source.slice(0, 50);
    } else {
      const search = this.assetSearchText.toLowerCase();
      this.filteredAssets = source
        .filter(
          (item: any) =>
            item.name?.toLowerCase().includes(search) ||
            item.serial_number?.toLowerCase().includes(search) ||
            item.system_name?.toLowerCase().includes(search),
        )
        .slice(0, 50);
    }
  }

  addAsset(asset: any) {
    if (!this.isAssetSelected(asset.id)) {
      this.selectedAssets.push(asset);
      this.selectedAssetsByType[this.targetType] = [...this.selectedAssets];
      this.assetSearchText = '';
      this.showDropdown = false;
      this.filterAssets();
    }
  }

  removeAsset(assetId: number) {
    this.selectedAssets = this.selectedAssets.filter((a) => a.id !== assetId);
    this.selectedAssetsByType[this.targetType] = [...this.selectedAssets];
  }

  isAssetSelected(assetId: number): boolean {
    return this.selectedAssets.some((a) => a.id === assetId);
  }

  setGenerateActaAfterSave(value: boolean) {
    this.generateActaAfterSave = value;
  }

  clearFilters() {
    this.filterDateFrom = getFirstDayOfCurrentMonthInputValue();
    this.filterDateTo = getTodayDateInputValue();
    this.filterAssetType = '';
    this.filterSeverity = '';
    this.filterIncidentType = '';
    this.filterReportedBy = '';
    this.filterStatus = '';
    this.onFilterChange();
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  saveNovedad(event: Event) {
    event.preventDefault();

    if (!this.requireManageNovedades()) {
      return;
    }

    if (this.selectedAssets.length === 0) {
      this.toastService.error('Debe seleccionar al menos un activo afectado');
      return;
    }

    const baseData = {
      description: this.newNovedad.description,
      severity: this.newNovedad.severity,
      incident_type: this.newNovedad.incident_type,
      status: this.newNovedad.status,
    };

    if (this.isEditing) {
      const payload: any = { ...baseData };
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
        },
      });
    } else {
      const shouldGenerateActa = this.generateActaAfterSave;
      let createCount = 0;
      const totalAssets = this.selectedAssets.length;
      const createdNovedades: any[] = [];

      this.selectedAssets.forEach((asset) => {
        const payload: any = { ...baseData };
        if (this.targetType === 'CAMERA') payload.camera = asset.id;
        else if (this.targetType === 'SERVER') payload.server = asset.id;
        else if (this.targetType === 'SYSTEM') payload.system = asset.id;
        else if (this.targetType === 'GEAR') payload.cameraman_gear = asset.id;

        this.novedadService.createNovedad(payload).subscribe({
          next: (novedad) => {
            createCount++;
            createdNovedades.push(novedad);
            if (createCount === totalAssets) {
              this.toastService.success(
                totalAssets === 1
                  ? 'Novedad registrada correctamente'
                  : `Se crearon ${totalAssets} novedades correctamente`,
              );
              this.closeForm();
              this.loadData();
              if (shouldGenerateActa) {
                this.openActaModal([...createdNovedades]);
              }
            }
          },
          error: (err) => {
            console.error('Error al crear novedad:', err);
            this.toastService.error(`Error al crear novedad para ${asset.name} `);
          },
        });
      });
    }
  }

  openActaModal(novedades?: any[]) {
    this.actaTargetNovedades = novedades || null;
    const saved = localStorage.getItem('acta_responsable');
    if (saved) {
      let p: any;
      try { p = JSON.parse(saved); } catch { p = {}; }
      this.actaForm.grado = p.grado || '';
      this.actaForm.nombre = p.nombre || '';
      this.actaForm.aeropuerto = p.aeropuerto || '';
    }
    const now = new Date();
    this.actaForm.hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.actaForm.numero = '';
    this.showActaModal = true;
    setTimeout(() => this.initSignaturePad(), 50);
  }

  closeActaModal() {
    this.showActaModal = false;
  }

  async generateActa() {
    localStorage.setItem(
      'acta_responsable',
      JSON.stringify({
        grado: this.actaForm.grado,
        nombre: this.actaForm.nombre,
        aeropuerto: this.actaForm.aeropuerto,
      }),
    );
    const logoBase64 = await this.getLogoBase64();
    this.actaForm.firma = this.getSignatureBase64();
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
    } catch {
      return '';
    }
  }

  private buildActaHtml(logoBase64: string): string {
    const now = new Date();
    const [hh, mm] = this.actaForm.hora.split(':');
    const day = now.getDate().toString().padStart(2, '0');
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const novedades = this.actaTargetNovedades ?? this.novedades;
    const groups = novedades.reduce(
      (acc, n) => {
        const key = n.incident_type || 'SIN CLASIFICAR';
        if (!acc[key]) acc[key] = [];
        acc[key].push(
          n.camera_name || n.server_name || n.system_name || n.cameraman_gear_name || 'Desconocido',
        );
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const sectionsHtml = Object.entries(groups)
      .map(
        ([type, assets]) => `
      <h2>${this.escapeHtml(type)}</h2>
      <ul>
        ${(assets as string[]).map((a) => `<li>${this.escapeHtml(a)}</li>`).join('')}
      </ul>
    `,
      )
      .join('');

    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" width="120" alt="Logo PSA" style="margin-bottom: 10px;">`
      : '';

    const firmaHtml =
      this.actaForm.firma && this.actaForm.firma.startsWith('data:image')
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

  initSignaturePad() {
    const canvas = this.sigPad?.nativeElement;
    if (!canvas) return;
    this.sigCtx = canvas.getContext('2d')!;
    this.sigCtx.strokeStyle = '#000';
    this.sigCtx.lineWidth = 2;
    this.sigCtx.lineCap = 'round';
    this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.addEventListener('mousedown', (e) => this.sigStart(e.offsetX, e.offsetY));
    canvas.addEventListener('mousemove', (e) => {
      if (this.sigDrawing) this.sigDraw(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('mouseup', () => (this.sigDrawing = false));
    canvas.addEventListener('mouseleave', () => (this.sigDrawing = false));
    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        this.sigStart(t.clientX - r.left, t.clientY - r.top);
      },
      { passive: false },
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        if (!this.sigDrawing) return;
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        this.sigDraw(t.clientX - r.left, t.clientY - r.top);
      },
      { passive: false },
    );
    canvas.addEventListener('touchend', () => (this.sigDrawing = false));
  }

  private sigStart(x: number, y: number) {
    this.sigDrawing = true;
    this.sigCtx!.beginPath();
    this.sigCtx!.moveTo(x, y);
  }

  private sigDraw(x: number, y: number) {
    this.sigCtx!.lineTo(x, y);
    this.sigCtx!.stroke();
  }

  clearSignature() {
    const canvas = this.sigPad?.nativeElement;
    if (canvas && this.sigCtx) {
      this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.actaForm.firma = '';
  }

  private getSignatureBase64(): string {
    const canvas = this.sigPad?.nativeElement;
    if (!canvas) return '';
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) return '';
    return canvas.toDataURL('image/png');
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private normalizeNovedadRow(raw: any): NovedadViewModel {
    const cameraId = this.toId(raw?.camera);
    const serverId = this.toId(raw?.server);
    const systemId = this.toId(raw?.system);
    const gearId = this.toId(raw?.cameraman_gear);

    const cameraName = this.cleanText(raw?.camera_name || raw?.camera?.name);
    const serverName = this.cleanText(raw?.server_name || raw?.server?.name);
    const systemName = this.cleanText(raw?.system_name || raw?.system?.name);
    const gearName = this.cleanText(raw?.cameraman_gear_name || raw?.cameraman_gear?.name);

    const assetLabel = cameraName || serverName || systemName || gearName || 'Desconocido';
    const assetType: NovedadAssetType = cameraId
      ? 'CAMERA'
      : serverId
        ? 'SERVER'
        : systemId
          ? 'SYSTEM'
          : gearId
            ? 'GEAR'
            : 'UNKNOWN';

    const severity = this.isValidSeverity(raw?.severity) ? raw.severity : 'MEDIUM';
    const status = this.isValidStatus(raw?.status) ? raw.status : 'OPEN';

    return {
      ...raw,
      id: Number(raw?.id ?? 0),
      created_at: this.cleanText(raw?.created_at) || new Date().toISOString(),
      camera: cameraId,
      server: serverId,
      system: systemId,
      cameraman_gear: gearId,
      camera_name: cameraName,
      server_name: serverName,
      system_name: systemName,
      cameraman_gear_name: gearName,
      severity,
      status,
      incident_type: this.cleanText(raw?.incident_type) || 'SIN_CLASIFICAR',
      reported_by: this.cleanText(raw?.reported_by) || '',
      description: this.cleanText(raw?.description) || 'Sin descripción',
      assetLabel,
      assetType,
    };
  }

  private logNovedadShapeWarnings(rows: NovedadViewModel[]) {
    if (environment.production) return;
    const incomplete = rows.filter(
      (row) =>
        !row.id ||
        !row.created_at ||
        !row.description ||
        (!row.camera && !row.server && !row.system && !row.cameraman_gear),
    );
    if (incomplete.length > 0) {
      console.warn('[Novedades] Filas incompletas normalizadas:', incomplete);
    }
  }

  private cleanText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim();
  }

  private toId(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'object' && value !== null) {
      return this.toId((value as any).id);
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private isValidSeverity(value: unknown): value is NovedadSeverity {
    return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL';
  }

  private isValidStatus(value: unknown): value is NovedadStatus {
    return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'CLOSED';
  }

  private toStartOfDayIso(dateValue: string): string | undefined {
    if (!dateValue) return undefined;
    return `${dateValue}T00:00:00`;
  }

  private toEndOfDayIso(dateValue: string): string | undefined {
    if (!dateValue) return undefined;
    return `${dateValue}T23:59:59`;
  }

  get maxDate(): string {
    return getTodayDateInputValue();
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    };
    return map[severity] || severity;
  }

  deleteNovedad(id: number) {
    if (!this.requireManageNovedades()) {
      return;
    }
    if (!confirm('¿Está seguro de eliminar esta novedad?')) return;

    this.novedadService.deleteNovedad(id).subscribe({
      next: () => {
        this.toastService.success('Novedad eliminada correctamente');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al eliminar novedad:', err);
        this.toastService.error('Error al eliminar la novedad');
      },
    });
  }

  getNovedadTypeLabel(novedad: any): string {
    if (novedad.assetType === 'CAMERA' || novedad.camera_name || novedad.camera) return 'CÁMARA';
    if (novedad.assetType === 'SERVER' || novedad.server_name || novedad.server) return 'SERVIDOR';
    if (novedad.assetType === 'SYSTEM' || novedad.system_name || novedad.system) return 'SISTEMA';
    if (novedad.assetType === 'GEAR' || novedad.cameraman_gear_name || novedad.cameraman_gear) return 'EQUIPAMIENTO';
    return 'GENÉRICO';
  }
}
