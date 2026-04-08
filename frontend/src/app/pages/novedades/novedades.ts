import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NovedadService } from '../../services/novedad.service';
import { AssetService } from '../../services/asset.service';
import { PersonnelService } from '../../services/personnel.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PermissionCodes } from '../../auth/auth.models';
import { getFirstDayOfCurrentMonthInputValue, getTodayDateInputValue } from '../../utils/date-inputs';
import { NovedadFiltersComponent, NovedadFilters } from './components/novedad-filters.component';
import { NovedadViewModel, normalizeNovedadRow, toStartOfDayIso, toEndOfDayIso } from './utils/novedad-normalizers';
import { ActaFormData } from './components/acta-form.component';
import { TargetType } from './components/novedad-asset-selector.component';
import { buildActaHtml, getLogoBase64 } from './utils/acta-generator';
import { NovedadForm } from './components/novedad-form.component';
import { NovedadFormComponent } from './components/novedad-form.component';
import { RowActaModalComponent } from './components/row-acta-modal.component';
import { NovedadTableComponent } from './components/novedad-table.component';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    NovedadFiltersComponent,
    NovedadFormComponent,
    RowActaModalComponent,
    NovedadTableComponent,
  ],
  templateUrl: './novedades.html',
  providers: [NovedadService, AssetService],
})
export class NovedadesComponent implements OnInit {
  private novedadService = inject(NovedadService);
  private assetService = inject(AssetService);
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);
  private confirmModalService = inject(ConfirmModalService);
  readonly authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Data
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
  filters: NovedadFilters = {
    searchText: '',
    filterStatus: '',
    filterSeverity: '',
    filterIncidentType: '',
    filterAssetType: '',
    filterDateFrom: getFirstDayOfCurrentMonthInputValue(),
    filterDateTo: getTodayDateInputValue(),
    filterReportedBy: '',
    filterTicketNumber: '',
  };

  // Form state
  showForm = false;
  isEditing = false;
  showRowActaModal = false;
  rowActaNovedad: any = null;

  actaFormData: ActaFormData = {
    numero: '',
    grado: '',
    nombre: '',
    aeropuerto: '',
    hora: '',
    firma: '',
  };

  actaTargetNovedades: any[] | null = null;
  targetType: TargetType = 'CAMERA';
  selectedAssets: any[] = [];
  generateActaAfterSave = false;
  formData: NovedadForm = this.getEmptyForm();

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
  }

  loadData() {
    this.isLoadingTable = true;
    const filterParams: any = {
      search: this.filters.searchText || undefined,
      status: this.filters.filterStatus || undefined,
      severity: this.filters.filterSeverity || undefined,
      incident_type: this.filters.filterIncidentType || undefined,
      asset_type: this.filters.filterAssetType || undefined,
      created_at__gte: toStartOfDayIso(this.filters.filterDateFrom),
      created_at__lte: toEndOfDayIso(this.filters.filterDateTo),
      reported_by: this.filters.filterReportedBy || undefined,
    };
    
    // Agregar filtro por ticket si está presente
    if (this.filters.filterTicketNumber) {
      filterParams.coc_ticket_number__icontains = this.filters.filterTicketNumber;
    }
    
    this.novedadService
      .getNovedades(this.currentPage, filterParams)
      .subscribe({
        next: (data: any) => {
          this.ngZone.run(() => {
            const rawRows = data?.results ?? data ?? [];
            this.novedades = (Array.isArray(rawRows) ? rawRows : []).map(normalizeNovedadRow);
            this.totalCount = data?.count ?? this.novedades.length;
            this.isLoadingTable = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error fetching novedades:', err);
            this.novedades = [];
            this.totalCount = 0;
            this.isLoadingTable = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  onFiltersChange(newFilters: NovedadFilters) {
    this.filters = newFilters;
    this.currentPage = 1;
    this.loadData();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }

  loadAssets() {
    this.assetService.getSystems().subscribe((data) => {
      this.systems = (data as any)?.results ?? data;
    });
    this.assetService.getServers().subscribe((data) => {
      this.servers = (data as any)?.results ?? data;
    });
    this.assetService.getCameras().subscribe((data) => {
      this.cameras = (data as any)?.results ?? data;
    });
    this.assetService.getCameramanGear().subscribe((data) => {
      this.gear = (data as any)?.results ?? data;
    });
  }

  openForm() {
    if (!this.requireManageNovedades()) return;
    
    this.showForm = true;
    this.isEditing = false;
    this.formData = this.getEmptyForm();
    this.targetType = 'CAMERA';
    this.selectedAssets = [];
    this.generateActaAfterSave = false;
    this.loadActaFromStorage();
    this.loadAssets();
    this.autofillActaFromAuthenticatedUser();
    this.cdr.detectChanges();
  }

  private autofillActaFromAuthenticatedUser(): void {
    const user = this.authService.user();
    if (!user) {
      this.toastService.error('No hay un usuario autenticado.');
      return;
    }

    if (!user.linked_person_id) {
      this.toastService.warning('Su usuario no tiene datos de personal vinculados. Contacte al administrador.');
      return;
    }

    this.personnelService.getPeople().subscribe({
      next: (people) => {
        const results = Array.isArray((people as any)?.results) ? (people as any).results : people;
        const person = Array.isArray(results) ? results.find((p: any) => p.id === user.linked_person_id) : null;

        if (!person) {
          this.toastService.warning('No se encontraron sus datos de personal. Contacte al administrador.');
          return;
        }

        const fullName = `${person.first_name} ${person.last_name}`;
        const rank = this.mapPersonRankToGrade(person.rank);

        if (!this.actaFormData.grado) this.actaFormData.grado = rank;
        if (!this.actaFormData.nombre) this.actaFormData.nombre = fullName;
        if (!this.actaFormData.aeropuerto && person.unit_name) this.actaFormData.aeropuerto = person.unit_name;

        this.toastService.show('Datos de responsable completados automáticamente.', 'info');
      },
      error: () => {
        console.warn('No se pudo cargar personal para autocompletar acta.');
        this.toastService.warning('No se pudo cargar su perfil de personal. Intente nuevamente.');
      },
    });
  }

  private mapPersonRankToGrade(rank: string | null | undefined): string {
    if (!rank) return '';
    const rankMap: Record<string, string> = {
      OFICIAL_AYUDANTE: 'OF. AYUDANTE',
      OFICIAL_PRINCIPAL: 'OF. PRINCIPAL',
      OFICIAL_MAYOR: 'OF. MAYOR',
      OFICIAL_JEFE: 'OF. JEFE',
      SUBINSPECTOR: 'SUBINSPECTOR',
      INSPECTOR: 'INSPECTOR',
      COMISIONADO_MAYOR: 'COM. MAYOR',
      COMISIONADO_GENERAL: 'COM. GENERAL',
      CIVIL: 'CIVIL',
    };
    return rankMap[rank] || '';
  }

  editNovedad(novedad: NovedadViewModel) {
    if (!this.requireManageNovedades()) return;

    this.isEditing = true;
    this.formData = {
      camera: novedad.camera,
      server: novedad.server,
      system: novedad.system,
      cameraman_gear: novedad.cameraman_gear,
      description: novedad.description,
      severity: novedad.severity,
      incident_type: novedad.incident_type,
      status: novedad.status,
      coc_ticket_number: novedad.coc_ticket_number || null,
    };
    this.showForm = true;
    this.generateActaAfterSave = false;
    this.loadAssets();
    this.loadActaFromStorage();
    this.cdr.detectChanges();

    // Set selected asset based on type
    if (novedad.camera) {
      this.targetType = 'CAMERA';
      const camera = this.cameras.find((c) => c.id === novedad.camera);
      if (camera) this.selectedAssets = [camera];
    } else if (novedad.server) {
      this.targetType = 'SERVER';
      const server = this.servers.find((s) => s.id === novedad.server);
      if (server) this.selectedAssets = [server];
    } else if (novedad.system) {
      this.targetType = 'SYSTEM';
      const system = this.systems.find((s) => s.id === novedad.system);
      if (system) this.selectedAssets = [system];
    } else if (novedad.cameraman_gear) {
      this.targetType = 'GEAR';
      const gearItem = this.gear.find((g) => g.id === novedad.cameraman_gear);
      if (gearItem) this.selectedAssets = [gearItem];
    }
  }

  closeForm() {
    this.showForm = false;
    this.selectedAssets = [];
    this.isEditing = false;
    this.generateActaAfterSave = false;
    this.formData = this.getEmptyForm();
    this.targetType = 'CAMERA';
  }

  private getEmptyForm(): NovedadForm {
    return {
      camera: null,
      server: null,
      system: null,
      cameraman_gear: null,
      description: '',
      severity: 'MEDIUM',
      incident_type: 'FALLA_TECNICA',
      status: 'OPEN',
      coc_ticket_number: null,
    };
  }

  onTargetTypeChange(type: TargetType) {
    this.targetType = type;
  }

  onSelectedAssetsChange(assets: any[]) {
    this.selectedAssets = assets;
  }

  onActaFormChange(formData: ActaFormData) {
    this.actaFormData = formData;
  }

  saveNovedad(event: Event) {
    event.preventDefault();

    if (!this.requireManageNovedades()) return;

    if (this.selectedAssets.length === 0) {
      this.toastService.error('Debe seleccionar al menos un activo afectado');
      return;
    }

    const baseData = {
      description: this.formData.description,
      severity: this.formData.severity,
      incident_type: this.formData.incident_type,
      status: this.formData.status,
    };

    if (this.isEditing) {
      const payload: any = { ...baseData };
      if (this.targetType === 'CAMERA') payload.camera = this.selectedAssets[0].id;
      else if (this.targetType === 'SERVER') payload.server = this.selectedAssets[0].id;
      else if (this.targetType === 'SYSTEM') payload.system = this.selectedAssets[0].id;
      else if (this.targetType === 'GEAR') payload.cameraman_gear = this.selectedAssets[0].id;

      this.novedadService.updateNovedad(this.formData.camera || this.formData.server || this.formData.system || this.formData.cameraman_gear || 0, payload).subscribe({
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
                totalAssets === 1 ? 'Novedad registrada correctamente' : `Se crearon ${totalAssets} novedades correctamente`
              );
              this.closeForm();
              this.loadData();
              if (shouldGenerateActa) {
                this.generateActa([...createdNovedades]);
              }
            }
          },
          error: (err) => {
            console.error('Error al crear novedad:', err);
            this.toastService.error(`Error al crear novedad para ${asset.name}`);
          },
        });
      });
    }
  }

  openActaForRow(novedad: NovedadViewModel) {
    this.rowActaNovedad = novedad;
    this.loadActaFromStorage();
    this.showRowActaModal = true;
    this.cdr.detectChanges();
  }

  closeRowActaModal() {
    this.showRowActaModal = false;
    this.rowActaNovedad = null;
  }

  private loadActaFromStorage() {
    const saved = localStorage.getItem('acta_responsable');
    if (saved) {
      let p: any;
      try { p = JSON.parse(saved); } catch { p = {}; }
      this.actaFormData = { ...this.actaFormData, ...p };
    }
    const now = new Date();
    this.actaFormData.hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  async generateActa(novedades?: any[]) {
    this.actaTargetNovedades = novedades || null;
    localStorage.setItem('acta_responsable', JSON.stringify({
      numero: this.actaFormData.numero,
      grado: this.actaFormData.grado,
      nombre: this.actaFormData.nombre,
      aeropuerto: this.actaFormData.aeropuerto,
    }));

    const logoBase64 = await getLogoBase64();
    const html = buildActaHtml(this.actaFormData, this.actaTargetNovedades || this.novedades, logoBase64);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toastService.error('El navegador bloqueó la ventana emergente. Permita ventanas emergentes e intente nuevamente.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 600);
    this.toastService.success('Acta lista para imprimir/guardar como PDF');
  }

  async deleteNovedad(id: number) {
    if (!this.requireManageNovedades()) return;
    try {
      await this.confirmModalService.confirmDelete('esta novedad', 'novedad');
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
    } catch {
      // Usuario canceló
    }
  }

  prepareEmail(novedad: NovedadViewModel) {
    const subject = encodeURIComponent(`Novedad: ${novedad.assetLabel} - ${this.getSeverityLabel(novedad.severity)}`);
    const body = encodeURIComponent(
      `Activo: ${novedad.assetLabel}\n` +
      `Tipo: ${this.getNovedadTypeLabel(novedad)}\n` +
      `Severidad: ${this.getSeverityLabel(novedad.severity)}\n` +
      `Estado: ${novedad.status}\n` +
      `Descripción: ${novedad.description}\n` +
      `Fecha: ${new Date(novedad.created_at).toLocaleString('es-AR')}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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

  getNovedadTypeLabel(novedad: any): string {
    if (novedad.assetType === 'CAMERA' || novedad.camera_name || novedad.camera) return 'CÁMARA';
    if (novedad.assetType === 'SERVER' || novedad.server_name || novedad.server) return 'SERVIDOR';
    if (novedad.assetType === 'SYSTEM' || novedad.system_name || novedad.system) return 'SISTEMA';
    if (novedad.assetType === 'GEAR' || novedad.cameraman_gear_name || novedad.cameraman_gear) return 'EQUIPAMIENTO';
    return 'GENÉRICO';
  }
}
