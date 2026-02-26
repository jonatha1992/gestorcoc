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

  currentPerson: any = this.getEmptyPerson();

  ngOnInit() {
    this.loadUnits();
    this.loadPeople();
    this.loadSystems();
  }

  loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (data) => {
        const sorted = [...(data || [])].sort((a, b) =>
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
    this.personnelService.getPeople().subscribe({
      next: (data) => this.people.set(data),
      error: (err) => console.error('Error fetching people:', err)
    });
  }

  loadSystems() {
    this.assetService.getSystems().subscribe({
      next: (data) => this.systems.set(data),
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
