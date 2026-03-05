import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../../services/personnel.service';
import { AssetService, Unit } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';

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

  people = signal<any[]>([]);
  systems = signal<any[]>([]);
  units = signal<Unit[]>([]);
  showForm = signal(false);
  isEditing = false;
  searchText = '';

  // Pagination
  currentPage = 1;
  totalCount = 0;
  pageSize = 50;
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  // Filters
  filterRole = '';
  filterActive = '';
  filterUnit = '';
  filterGuardGroup = '';
  private searchTimer: any;

  currentPerson: any = this.getEmptyPerson();

  ngOnInit() {
    this.loadUnits();
    this.loadPeople();
    this.loadSystems();
  }

  loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (data) => {
        const results = (data as any)?.results ?? data;
        const sorted = [...(results || [])].sort((a, b) =>
          (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' })
        );
        this.units.set(sorted);

        if (!this.currentPerson.unit && sorted.length > 0) {
          this.currentPerson.unit = sorted[0].code;
        }
      },
      error: (err) => {
        console.error('Error fetching units:', err);
        this.toastService.show('Error al cargar unidades', 'error');
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
        const results = (data as any)?.results ?? data;
        this.people.set(results);
        this.totalCount = (data as any)?.count ?? results.length;
      },
      error: (err) => console.error('Error fetching people:', err)
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
    this.assetService.getSystems().subscribe({
      next: (data) => this.systems.set((data as any)?.results ?? data),
      error: (err) => console.error('Error fetching systems:', err)
    });
  }

  getEmptyPerson() {
    const availableUnits = this.units();
    return {
      first_name: '',
      last_name: '',
      badge_number: '',
      role: 'OPERATOR',
      rank: '',
      unit: availableUnits.length > 0 ? availableUnits[0].code : '',
      guard_group: '',
      is_active: true,
      assigned_systems: []
    };
  }

  openForm() {
    this.isEditing = false;
    this.currentPerson = this.getEmptyPerson();
    this.showForm.set(true);
  }

  editPerson(person: any) {
    this.isEditing = true;
    // Copy object to avoid reference issues, map assigned_systems IDs
    this.currentPerson = {
      ...person,
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
    const updatedPerson = { ...person, is_active: !person.is_active };
    this.personnelService.updatePerson(person.id, updatedPerson).subscribe({
      next: () => {
        this.toastService.show(updatedPerson.is_active ? 'Personal activado' : 'Personal desactivado', 'success');
        this.loadPeople();
      },
      error: (err) => this.toastService.show('Error al cambiar estado', 'error')
    });
  }

  deletePerson(id: number) {
    if (confirm('ADVERTENCIA: ¿Está seguro de eliminar permanentemente a este usuario? Esta acción no se puede deshacer.')) {
      this.personnelService.deletePerson(id).subscribe({
        next: () => {
          this.toastService.show('Personal eliminado correctamente', 'success');
          this.loadPeople();
        },
        error: (err) => this.toastService.show('Error al eliminar usuario', 'error')
      });
    }
  }

  savePerson() {
    const request = this.isEditing
      ? this.personnelService.updatePerson(this.currentPerson.id, this.currentPerson)
      : this.personnelService.createPerson(this.currentPerson);

    request.subscribe({
      next: (res) => {
        this.toastService.show(this.isEditing ? 'Personal actualizado' : 'Personal registrado', 'success');
        this.closeForm();
        this.loadPeople();
      },
      error: (err) => {
        console.error('Error saving person:', err);
        this.toastService.show('Error al guardar personal', 'error');
      }
    });
  }
}
