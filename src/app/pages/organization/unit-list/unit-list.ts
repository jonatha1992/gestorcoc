import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UnitService, ToastService } from '../../../services';
import { Unit } from '../../../models';
import { LoaderComponent } from '../../../components/ui/loader/loader';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-unit-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LoaderComponent],
    templateUrl: './unit-list.html'
})
export class UnitListComponent implements OnInit {
    private unitService = inject(UnitService);
    private toastService = inject(ToastService);

    units$!: Observable<Unit[]>;
    isLoading = true;
    showModal = false;
    isEditing = false;

    // Form data
    currentUnit: Partial<Unit> = {
        name: '',
        description: ''
    };

    ngOnInit() {
        this.loadUnits();
    }

    loadUnits() {
        console.log('Loading units...');
        this.units$ = this.unitService.getUnits();
        this.units$.subscribe({
            next: (data) => {
                console.log('Units received:', data);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading units:', err);
                this.isLoading = false;
                this.toastService.error('Error al cargar las unidades');
            }
        });
    }

    openCreateModal() {
        this.isEditing = false;
        this.currentUnit = { name: '', description: '' };
        this.showModal = true;
    }

    openEditModal(unit: Unit) {
        this.isEditing = true;
        this.currentUnit = { ...unit };
        this.showModal = true;
    }

    async saveUnit() {
        if (!this.currentUnit.name) {
            this.toastService.warning('El nombre es obligatorio');
            return;
        }

        try {
            if (this.isEditing && this.currentUnit.id) {
                await this.unitService.updateUnit(this.currentUnit as Unit);
                this.toastService.success('Unidad actualizada correctamente');
            } else {
                await this.unitService.addUnit(this.currentUnit as Unit);
                this.toastService.success('Unidad creada correctamente');
            }
            this.showModal = false;
        } catch (error) {
            this.toastService.error('Error al guardar la unidad');
        }
    }

    async deleteUnit(id: string) {
        if (confirm('¿Está seguro de eliminar esta unidad?')) {
            try {
                await this.unitService.deleteUnit(id);
                this.toastService.success('Unidad eliminada');
            } catch (error) {
                this.toastService.error('Error al eliminar la unidad');
            }
        }
    }
}
