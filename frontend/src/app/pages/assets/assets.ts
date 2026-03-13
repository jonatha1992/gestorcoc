import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../../services/asset.service';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PermissionCodes } from '../../auth/auth.models';
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
  private cdr = inject(ChangeDetectorRef);
  loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  systems: any[] = [];
  units: any[] = [];
  groupedSystems: { unitId: number, unitName: string, unitCode: string, systems: any[] }[] = [];
  gear: any[] = [];
  totalCameras = 0;
  totalServers = 0;
  error: string | null = null;
  activeTab: 'cctv' | 'gear' = 'cctv';
  isLoadingCctv = true;
  isLoadingGear = true;

  expandedSystemIds = new Set<number>();
  expandedServerIds = new Set<number>();

  searchText = '';
  cctvFilterUnit = '';
  cctvFilterSystemType = '';
  cctvFilterIsActive = '';
  cctvFilterCameraStatus = '';
  gearFilterCondition = '';
  gearFilterIsActive = '';
  gearFilterAssignment = '';

  get filteredGear() {
    const search = this.searchText.toLowerCase().trim();
    return this.gear.filter(g => {
      const matchesSearch = !search ||
        g.name?.toLowerCase().includes(search) ||
        g.serial_number?.toLowerCase().includes(search) ||
        g.assigned_to?.toLowerCase().includes(search);

      const isAssigned = !!(g.assigned_to && String(g.assigned_to).trim());
      const matchesAssignment =
        this.gearFilterAssignment === 'assigned'
          ? isAssigned
          : this.gearFilterAssignment === 'unassigned'
            ? !isAssigned
            : true;

      return matchesSearch && matchesAssignment;
    });
  }

  get filteredGroupedSystems() {
    const search = this.searchText.toLowerCase().trim();

    return this.groupedSystems.map(group => {
      const isGroupMatch =
        !search ||
        group.unitName?.toLowerCase().includes(search) ||
        group.unitCode?.toLowerCase().includes(search);

      const systems = (group.systems || []).map((system: any) => {
        const servers = (system.servers || []).map((server: any) => {
          const cameras = (server.cameras || []).filter((cam: any) =>
            this.cctvFilterCameraStatus ? cam.status === this.cctvFilterCameraStatus : true
          );
          return { ...server, cameras };
        }).filter((server: any) =>
          this.cctvFilterCameraStatus ? server.cameras.length > 0 : true
        );

        return {
          ...system,
          servers,
          camera_count: servers.reduce((acc: number, server: any) => acc + (server.cameras?.length || 0), 0),
        };
      }).filter((system: any) =>
        this.cctvFilterCameraStatus ? (system.servers?.length || 0) > 0 : true
      );

      const matchingSystems = systems.filter((s: any) => {
        const matchesSearch = !search ||
          isGroupMatch ||
          s.name?.toLowerCase().includes(search) ||
          s.servers?.some((srv: any) =>
            srv.name?.toLowerCase().includes(search) ||
            srv.ip_address?.toLowerCase().includes(search) ||
            srv.cameras?.some((cam: any) =>
              cam.name?.toLowerCase().includes(search) || cam.ip_address?.toLowerCase().includes(search)
            )
          );
        return matchesSearch;
      });

      return {
        ...group,
        systems: matchingSystems
      };
    }).filter(group =>
      group.systems.length > 0 ||
      (!search && group.systems.length === 0 && this.cctvFilterCameraStatus === '') ||
      group.unitName?.toLowerCase().includes(search) ||
      group.unitCode?.toLowerCase().includes(search)
    );
  }

  ngOnInit() {
    // setTimeout evita NG0100: las señales del interceptor HTTP disparan CD
    // antes de que el forkJoin complete, causando que systems.length cambie en mid-cycle
    setTimeout(() => this.refreshData());
  }

  refreshData() {
    this.isLoadingCctv = true;
    this.isLoadingGear = true;
    this.loadingService.show();
    this.error = null;

    forkJoin({
      systems: this.assetService.getSystems({
        unit: this.cctvFilterUnit || undefined,
        system_type: this.cctvFilterSystemType || undefined,
        is_active: this.cctvFilterIsActive || undefined,
      }),
      units: this.apiService.get<any[]>('api/units/'),
      gear: this.assetService.getCameramanGear({
        condition: this.gearFilterCondition || undefined,
        is_active: this.gearFilterIsActive || undefined,
      })
    }).pipe(
      timeout(30000)
    ).subscribe({
      next: (results) => {
        // Process Systems (paginado: {count, results: [...]})
        const systemsArr = (results.systems as any)?.results ?? results.systems;
        if (systemsArr) {
          this.systems = systemsArr;
          this.totalCameras = this.systems.reduce((acc: number, sys: any) => acc + (sys.camera_count || 0), 0);
          this.totalServers = this.systems.reduce((acc: number, sys: any) => acc + (sys.servers?.length || 0), 0);
        }

        // Process Units (paginado: {count, results: [...]})
        const unitsArr = (results.units as any)?.results ?? results.units;
        if (unitsArr) {
          this.units = unitsArr;
          this.groupSystems();
        }

        // Process Gear (paginado: {count, results: [...]})
        const gearArr = (results.gear as any)?.results ?? results.gear;
        if (gearArr) {
          this.gear = gearArr;
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

  onCctvFilterChange() {
    this.refreshData();
  }

  onGearFilterChange() {
    this.refreshData();
  }

  clearCctvFilters() {
    this.cctvFilterUnit = '';
    this.cctvFilterSystemType = '';
    this.cctvFilterIsActive = '';
    this.cctvFilterCameraStatus = '';
    this.refreshData();
  }

  clearGearFilters() {
    this.gearFilterCondition = '';
    this.gearFilterIsActive = '';
    this.gearFilterAssignment = '';
    this.refreshData();
  }

  groupSystems() {
    const groups: { [id: number]: any } = {};

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
  readonly reportAuthenticityModeOptions = [
    { value: '', label: 'Sin sugerencia' },
    { value: 'vms_propio', label: 'Propio VMS' },
    { value: 'hash_preventivo', label: 'Hash preventivo externo' },
    { value: 'sin_autenticacion', label: 'Sin autenticacion' },
    { value: 'otro', label: 'Otro metodo' },
  ];
  readonly reportHashOptions = [
    { value: 'sha1', label: 'SHA-1' },
    { value: 'sha3', label: 'SHA-3' },
    { value: 'sha256', label: 'SHA-256' },
    { value: 'sha512', label: 'SHA-512' },
    { value: 'otro', label: 'Otro' },
  ];

  get canManageAssets(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_ASSETS);
  }

  private requireManageAssets(): boolean {
    if (this.canManageAssets) {
      return true;
    }
    this.toastService.error('No tiene permiso para modificar equipamiento.');
    return false;
  }

  openSystemModal() {
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentSystem = {
      is_active: true,
      report_authenticity_mode_default: '',
      report_authenticity_detail_default: '',
      report_native_hash_algorithms_default: [],
      report_native_hash_algorithm_other_default: '',
      report_hash_program_default: '',
    };
    this.showSystemModal = true;
  }

  editSystem(sys: any) {
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentSystem = {
      ...sys,
      unit_id: sys.unit?.id,
      report_authenticity_mode_default: sys.report_authenticity_mode_default || '',
      report_authenticity_detail_default: sys.report_authenticity_detail_default || '',
      report_native_hash_algorithms_default: [...(sys.report_native_hash_algorithms_default || [])],
      report_native_hash_algorithm_other_default: sys.report_native_hash_algorithm_other_default || '',
      report_hash_program_default: sys.report_hash_program_default || '',
    };
    this.showSystemModal = true;
  }

  closeSystemModal() {
    this.showSystemModal = false;
    this.currentSystem = {};
  }

  toggleSystemNativeHash(algorithm: string) {
    const current = Array.isArray(this.currentSystem.report_native_hash_algorithms_default)
      ? this.currentSystem.report_native_hash_algorithms_default
      : [];
    if (current.includes(algorithm)) {
      this.currentSystem.report_native_hash_algorithms_default = current.filter((item: string) => item !== algorithm);
    } else {
      this.currentSystem.report_native_hash_algorithms_default = [...current, algorithm];
    }
  }

  hasSystemNativeHash(algorithm: string): boolean {
    return Array.isArray(this.currentSystem.report_native_hash_algorithms_default)
      && this.currentSystem.report_native_hash_algorithms_default.includes(algorithm);
  }

  saveSystem() {
    if (!this.requireManageAssets()) {
      return;
    }
    if (this.currentSystem.report_authenticity_mode_default !== 'otro') {
      this.currentSystem.report_authenticity_detail_default = '';
    }
    if (!this.hasSystemNativeHash('otro')) {
      this.currentSystem.report_native_hash_algorithm_other_default = '';
    }
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
    if (!this.requireManageAssets()) {
      return;
    }
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
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentServer = { system: systemId, is_active: true };
    this.showServerModal = true;
  }

  editServer(srv: any) {
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentServer = { ...srv };
    this.showServerModal = true;
  }

  closeServerModal() {
    this.showServerModal = false;
    this.currentServer = {};
  }

  saveServer() {
    if (!this.requireManageAssets()) {
      return;
    }
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
    if (!this.requireManageAssets()) {
      return;
    }
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
  readonly allowedCameraPhotoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  readonly cameraPhotoMaxBytes = 250 * 1024;
  readonly cameraPhotoMaxDimension = 960;
  isProcessingCameraPhoto = false;
  cameraPhotoError: string | null = null;

  openCameraModal(serverId: number) {
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentCamera = { server: serverId, status: 'ONLINE', resolution: '1080p', photo_data: '' };
    this.cameraPhotoError = null;
    this.showCameraModal = true;
  }

  editCamera(cam: any) {
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentCamera = { ...cam, photo_data: cam.photo_data || '' };
    this.cameraPhotoError = null;
    this.showCameraModal = true;
  }

  closeCameraModal() {
    this.showCameraModal = false;
    this.currentCamera = {};
    this.cameraPhotoError = null;
    this.isProcessingCameraPhoto = false;
  }

  saveCamera() {
    if (!this.requireManageAssets()) {
      return;
    }
    if (this.isProcessingCameraPhoto) {
      this.toastService.error('Espere a que termine la compresion de la foto.');
      return;
    }
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

  async onCameraPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!this.allowedCameraPhotoMimeTypes.has(file.type)) {
      this.cameraPhotoError = 'Formato no soportado. Use JPG, PNG o WEBP.';
      this.toastService.error(this.cameraPhotoError);
      input.value = '';
      return;
    }

    this.isProcessingCameraPhoto = true;
    this.cameraPhotoError = null;
    this.cdr.detectChanges();

    try {
      this.currentCamera.photo_data = await this.compressCameraPhoto(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo procesar la foto.';
      this.currentCamera.photo_data = '';
      this.cameraPhotoError = message;
      this.toastService.error(message);
      input.value = '';
    } finally {
      this.isProcessingCameraPhoto = false;
      this.cdr.detectChanges();
    }
  }

  clearCameraPhoto(input?: HTMLInputElement | null) {
    this.currentCamera.photo_data = '';
    this.cameraPhotoError = null;
    if (input) {
      input.value = '';
    }
  }

  getCameraPhotoSizeLabel(photoData: string): string {
    const sizeKb = this.estimateDataUrlBytes(photoData) / 1024;
    return `${Math.max(1, Math.round(sizeKb))} KB`;
  }

  private async compressCameraPhoto(file: File): Promise<string> {
    const source = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(source);
    let width = image.width;
    let height = image.height;
    const maxSide = Math.max(width, height);

    if (maxSide > this.cameraPhotoMaxDimension) {
      const ratio = this.cameraPhotoMaxDimension / maxSide;
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    let bestCandidate = '';
    const qualitySteps = [0.82, 0.72, 0.62, 0.52, 0.44];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo preparar la compresion de la imagen.');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      for (const quality of qualitySteps) {
        const candidate = canvas.toDataURL('image/webp', quality);
        if (!bestCandidate || this.estimateDataUrlBytes(candidate) < this.estimateDataUrlBytes(bestCandidate)) {
          bestCandidate = candidate;
        }
        if (this.estimateDataUrlBytes(candidate) <= this.cameraPhotoMaxBytes) {
          return candidate;
        }
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }

    if (bestCandidate) {
      throw new Error(
        `La imagen sigue superando ${Math.round(this.cameraPhotoMaxBytes / 1024)} KB luego de comprimirla.`
      );
    }

    throw new Error('No se pudo generar la foto comprimida.');
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada.'));
      image.src = source;
    });
  }

  private estimateDataUrlBytes(dataUrl: string): number {
    const payload = (dataUrl.split(',', 2)[1] || '').replace(/\s/g, '');
    if (!payload) {
      return 0;
    }
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    return Math.ceil((payload.length * 3) / 4) - padding;
  }

  deleteCamera(cam: any) {
    if (!this.requireManageAssets()) {
      return;
    }
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
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentGear = { condition: 'GOOD' }; // Default
    this.showGearModal = true;
  }

  editGear(item: any) {
    if (!this.requireManageAssets()) {
      return;
    }
    this.currentGear = { ...item };
    this.showGearModal = true;
  }

  closeGearModal() {
    this.showGearModal = false;
    this.currentGear = {};
  }

  saveGear() {
    if (!this.requireManageAssets()) {
      return;
    }
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
    if (!this.requireManageAssets()) {
      return;
    }
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
