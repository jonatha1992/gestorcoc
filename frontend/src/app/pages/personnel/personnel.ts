import { Component, OnInit, inject, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PermissionCodes, RoleLabels } from '../../auth/auth.models';
import { AuthService } from '../../services/auth.service';
import { AssetService, Unit } from '../../services/asset.service';
import { PersonnelService } from '../../services/personnel.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personnel.html',
  providers: [PersonnelService, AssetService]
})
export class PersonnelComponent implements OnInit {
  private personnelService = inject(PersonnelService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);
  private confirmModalService = inject(ConfirmModalService);
  readonly authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  readonly ROLE_LABELS: Record<string, string> = { ...RoleLabels };
  readonly ROLE_OPTIONS = [
    { value: 'OPERADOR', label: 'Operador' },
    { value: 'COORDINADOR_COC', label: 'Coordinador COC' },
    { value: 'CREV', label: 'CREV' },
    { value: 'COORDINADOR_CREV', label: 'Coordinador CREV' },
    { value: 'ADMIN', label: 'Administrador' },
  ];

  readonly RANK_OPTIONS = [
    { value: 'OFICIAL_AYUDANTE', label: 'Of. Ayte.' },
    { value: 'OFICIAL_PRINCIPAL', label: 'Oficial Principal' },
    { value: 'OFICIAL_MAYOR', label: 'Oficial Mayor' },
    { value: 'OFICIAL_JEFE', label: 'Oficial Jefe' },
    { value: 'SUBINSPECTOR', label: 'Subinspector' },
    { value: 'INSPECTOR', label: 'Inspector' },
    { value: 'COMISIONADO_MAYOR', label: 'Comisionado Mayor' },
    { value: 'COMISIONADO_GENERAL', label: 'Comisionado General' },
    { value: 'CIVIL', label: 'Civil' },
  ];
  readonly RANK_LABELS: Record<string, string> = this.RANK_OPTIONS.reduce(
    (acc, option) => ({ ...acc, [option.value]: option.label }),
    {} as Record<string, string>
  );

  people = signal<any[]>([]);
  systems = signal<any[]>([]);
  units = signal<Unit[]>([]);
  showForm = signal(false);
  isEditing = false;
  searchText = '';

  currentPage = 1;
  totalCount = 0;
  pageSize = 50;
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  filterRole = '';
  filterActive = '';
  filterUnit = '';
  filterGuardGroup = '';
  private searchTimer: any;

  currentPerson: any = this.getEmptyPerson();

  get canManagePersonnel(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_PERSONNEL);
  }

  ngOnInit() {
    this.loadUnits();
    this.loadPeople();
    // Ya no cargamos sistemas al inicio, se cargan al abrir el formulario
    // this.loadSystems();
  }

  getRoleLabel(role: string): string {
    return this.ROLE_LABELS[role] ?? role;
  }

  getRankLabel(rank: string): string {
    return this.RANK_LABELS[rank] ?? rank;
  }

  loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          const results = (data as any)?.results ?? data;
          const sorted = [...(results || [])].sort((a, b) =>
            (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' })
          );
          this.units.set(sorted);

          if (!this.currentPerson.unit && sorted.length > 0) {
            this.currentPerson.unit = sorted[0].code;
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error fetching units:', err);
          this.toastService.show('Error al cargar unidades', 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadPeople() {
    this.personnelService.getPeople(this.currentPage, {
      search: this.searchText || undefined,
      role: this.filterRole || undefined,
      is_active: this.filterActive,
      unit: this.filterUnit || undefined,
      guard_group: this.filterGuardGroup || undefined,
    }).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          const results = (data as any)?.results ?? data;
          this.people.set(results);
          this.totalCount = (data as any)?.count ?? results.length;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error fetching people:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadPeople();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadPeople();
  }

  clearFilters() {
    this.filterUnit = '';
    this.filterGuardGroup = '';
    this.filterRole = '';
    this.filterActive = '';
    this.onFilterChange();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPeople();
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const current = this.currentPage;
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  loadSystems() {
    // Si ya tenemos sistemas, no volvemos a cargar
    if (this.systems().length > 0) return;
    
    this.assetService.getSystems().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.systems.set((data as any)?.results ?? data);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error fetching systems:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  getEmptyPerson() {
    const availableUnits = this.units();
    return {
      first_name: '',
      last_name: '',
      badge_number: '',
      role: 'OPERADOR',
      rank: 'CIVIL',
      unit: availableUnits.length > 0 ? availableUnits[0].code : '',
      guard_group: '',
      is_active: true,
      assigned_systems: []
    };
  }

  openForm() {
    if (!this.requireManagePersonnel()) {
      return;
    }
    this.loadSystems();
    this.isEditing = false;
    this.currentPerson = this.getEmptyPerson();
    this.showForm.set(true);
  }

  editPerson(person: any) {
    if (!this.requireManagePersonnel()) {
      return;
    }
    this.loadSystems();
    this.isEditing = true;
    this.currentPerson = {
      ...person,
      rank: person.rank || 'CIVIL',
      assigned_systems: person.assigned_systems_details ? person.assigned_systems_details.map((s: any) => s.id) : []
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.currentPerson = this.getEmptyPerson();
  }

  isSystemSelected(systemId: number): boolean {
    return this.currentPerson.assigned_systems?.includes(systemId);
  }

  toggleSystem(systemId: number) {
    const current = this.currentPerson.assigned_systems || [];
    if (current.includes(systemId)) {
      this.currentPerson.assigned_systems = current.filter((id: number) => id !== systemId);
    } else {
      this.currentPerson.assigned_systems = [...current, systemId];
    }
  }

  toggleActive(person: any) {
    if (!this.requireManagePersonnel()) {
      return;
    }
    const updatedPerson = { ...person, is_active: !person.is_active };
    this.personnelService.updatePerson(person.id, updatedPerson).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show(updatedPerson.is_active ? 'Personal activado' : 'Personal desactivado', 'success');
          this.loadPeople();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Error al cambiar estado', 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  async deletePerson(id: number) {
    if (!this.requireManagePersonnel()) {
      return;
    }
    try {
      await this.confirmModalService.confirmDelete('este usuario', 'personal', 'ADVERTENCIA: Esta acción no se puede deshacer.');
      this.personnelService.deletePerson(id).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.toastService.show('Personal eliminado correctamente', 'success');
            this.loadPeople();
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.toastService.show('Error al eliminar usuario', 'error');
            this.cdr.detectChanges();
          });
        }
      });
    } catch {
      // Usuario canceló
    }
  }

  onBadgeNumberInput() {
    const raw = String(this.currentPerson.badge_number ?? '');
    this.currentPerson.badge_number = raw.replace(/\D/g, '').slice(0, 6);
  }

  savePerson() {
    if (!this.requireManagePersonnel()) {
      return;
    }
    this.onBadgeNumberInput();

    const request = this.isEditing
      ? this.personnelService.updatePerson(this.currentPerson.id, this.currentPerson)
      : this.personnelService.createPerson(this.currentPerson);

    request.subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show(this.isEditing ? 'Personal actualizado' : 'Personal registrado', 'success');
          this.closeForm();
          this.loadPeople();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error saving person:', err);
          this.toastService.show('Error al guardar personal', 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  private requireManagePersonnel(): boolean {
    if (this.canManagePersonnel) {
      return true;
    }
    this.toastService.error('No tiene permiso para modificar personal.');
    return false;
  }
}
