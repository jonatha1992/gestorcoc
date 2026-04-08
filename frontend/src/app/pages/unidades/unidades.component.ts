import { Component, OnInit, inject, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService, Unit } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmModalService } from '../../services/confirm-modal.service';
import { PermissionCodes } from '../../auth/auth.models';

@Component({
  selector: 'app-unidades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unidades.html',
})
export class UnidadesComponent implements OnInit {
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  private confirmModalService = inject(ConfirmModalService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  units = signal<Unit[]>([]);
  regionalUnits = signal<Unit[]>([]);
  localUnits = signal<Unit[]>([]);
  isLoading = signal(false);
  searchText = signal('');
  selectedUnit = signal<Unit | null>(null);
  showFormModal = signal(false);
  isEditing = signal(false);

  currentUnit: Partial<Unit> = {
    name: '',
    code: '',
    airport: '',
    province: '',
    latitude: null,
    longitude: null,
    map_enabled: false,
    parent: null,
  };

  ngOnInit() {
    this.loadUnits();
  }

  loadUnits() {
    this.isLoading.set(true);
    this.assetService.getUnits().subscribe({
      next: (data) => {
        this.units.set(data);
        // Separar regionales (sin parent) de locales (con parent)
        const allUnits = data;
        this.regionalUnits.set(allUnits.filter(u => !u.parent));
        this.localUnits.set(allUnits.filter(u => u.parent));
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar unidades');
        this.isLoading.set(false);
      }
    });
  }

  get filteredUnits(): Unit[] {
    const search = this.searchText().toLowerCase().trim();
    if (!search) {
      return this.units();
    }
    return this.units().filter(unit =>
      unit.name?.toLowerCase().includes(search) ||
      unit.code?.toLowerCase().includes(search) ||
      unit.airport?.toLowerCase().includes(search) ||
      unit.province?.toLowerCase().includes(search)
    );
  }

  get filteredUnitsCount(): number {
    return this.filteredUnits.length;
  }

  getRegionalUnits(): Unit[] {
    return this.regionalUnits();
  }

  canManageUnits(): boolean {
    return this.authService.hasPermission('manage_assets');
  }

  openCreateModal() {
    if (!this.canManageUnits()) {
      this.toastService.error('No tenés permisos para crear unidades');
      return;
    }
    this.isEditing.set(false);
    this.currentUnit = {
      name: '',
      code: '',
      airport: '',
      province: '',
      latitude: null,
      longitude: null,
      map_enabled: false,
      parent: null,
    };
    this.showFormModal.set(true);
  }

  openEditModal(unit: Unit) {
    if (!this.canManageUnits()) {
      this.toastService.error('No tenés permisos para editar unidades');
      return;
    }
    this.isEditing.set(true);
    this.currentUnit = { ...unit };
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
    this.currentUnit = {};
  }

  saveUnit() {
    if (!this.currentUnit.name || !this.currentUnit.code) {
      this.toastService.error('Nombre y código son obligatorios');
      return;
    }

    const payload = {
      name: this.currentUnit.name.trim(),
      code: this.currentUnit.code.trim().toUpperCase(),
      airport: this.currentUnit.airport?.trim() || '',
      province: this.currentUnit.province?.trim() || '',
      latitude: this.currentUnit.latitude,
      longitude: this.currentUnit.longitude,
      map_enabled: this.currentUnit.map_enabled || false,
      parent: this.currentUnit.parent,
    };

    if (this.isEditing()) {
      // Editar
      if (!this.currentUnit.id) return;
      
      this.assetService.updateUnit(this.currentUnit.id, payload).subscribe({
        next: () => {
          this.toastService.success('Unidad actualizada correctamente');
          this.closeFormModal();
          this.loadUnits();
        },
        error: (err) => {
          this.toastService.error('Error al actualizar unidad');
          console.error(err);
        }
      });
    } else {
      // Crear
      this.assetService.createUnit(payload).subscribe({
        next: () => {
          this.toastService.success('Unidad creada correctamente');
          this.closeFormModal();
          this.loadUnits();
        },
        error: (err) => {
          if (err.error?.code?.[0]) {
            this.toastService.error(`Código duplicado: ${err.error.code[0]}`);
          } else if (err.error?.name?.[0]) {
            this.toastService.error(`Nombre duplicado: ${err.error.name[0]}`);
          } else {
            this.toastService.error('Error al crear unidad');
          }
          console.error(err);
        }
      });
    }
  }

  async deleteUnit(unit: Unit) {
    if (!this.canManageUnits()) {
      this.toastService.error('No tenés permisos para eliminar unidades');
      return;
    }

    // Verificar si tiene unidades hijas
    const hasChildren = this.units().some(u => u.parent === unit.id);
    if (hasChildren) {
      this.toastService.error('No se puede eliminar: tiene unidades dependientes');
      return;
    }

    // Verificar si tiene sistemas asociados
    // (esto se podría verificar con un endpoint adicional si fuera necesario)

    try {
      await this.confirmModalService.confirmDelete(
        `${unit.name} (${unit.code})`,
        'unidad',
        'Esta acción no se puede deshacer.'
      );

      this.assetService.deleteUnit(unit.id).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.toastService.success('Unidad eliminada correctamente');
            this.loadUnits();
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.toastService.error('Error al eliminar unidad');
            this.cdr.detectChanges();
          });
        }
      });
    } catch {
      // Usuario canceló
    }
  }

  getParentUnitName(parentId: number | null): string {
    if (!parentId) return '';
    const parent = this.units().find(u => u.id === parentId);
    return parent ? `${parent.name} (${parent.code})` : '';
  }

  isRegional(unit: Unit): boolean {
    return !unit.parent;
  }

  getUnitIcon(unit: Unit): string {
    return this.isRegional(unit) ? '🏢' : '📍';
  }
}
