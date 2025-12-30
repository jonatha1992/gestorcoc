import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CctvSystemService, UnitService, ToastService } from '../../../services';
import { CctvSystem, Unit } from '../../../models';
import { LoaderComponent } from '../../../components/ui/loader/loader';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-system-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LoaderComponent],
    templateUrl: './system-list.html'
})
export class SystemListComponent implements OnInit {
    private systemService = inject(CctvSystemService);
    private unitService = inject(UnitService);
    private toastService = inject(ToastService);

    systems$!: Observable<CctvSystem[]>;
    units: Unit[] = [];
    isLoading = true;
    showModal = false;
    isEditing = false;

    currentSystem: Partial<CctvSystem> = {
        name: '',
        unitId: '',
        description: '',
        brand: '',
        model: '',
        ipAddress: '',
        location: ''
    };

    ngOnInit() {
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            this.unitService.getUnits().subscribe(units => this.units = units);
            this.systems$ = this.systemService.getSystems();
            this.systems$.subscribe({
                next: () => this.isLoading = false,
                error: () => {
                    this.isLoading = false;
                    this.toastService.error('Error al cargar los sistemas');
                }
            });
        } catch (error) {
            this.isLoading = false;
            this.toastService.error('Error al inicializar la página');
        }
    }

    getUnitName(unitId: string): string {
        return this.units.find(u => u.id === unitId)?.name || 'Sin Unidad';
    }

    openCreateModal() {
        this.isEditing = false;
        this.currentSystem = {
            name: '',
            unitId: '',
            description: '',
            brand: '',
            model: '',
            ipAddress: '',
            location: ''
        };
        this.showModal = true;
    }

    openEditModal(system: CctvSystem) {
        this.isEditing = true;
        this.currentSystem = { ...system };
        this.showModal = true;
    }

    async saveSystem() {
        if (!this.currentSystem.name || !this.currentSystem.unitId) {
            this.toastService.warning('Nombre y Unidad son obligatorios');
            return;
        }

        try {
            if (this.isEditing && this.currentSystem.id) {
                await this.systemService.updateSystem(this.currentSystem as CctvSystem);
                this.toastService.success('Sistema actualizado correctamente');
            } else {
                await this.systemService.addSystem(this.currentSystem as CctvSystem);
                this.toastService.success('Sistema creado correctamente');
            }
            this.showModal = false;
        } catch (error) {
            this.toastService.error('Error al guardar el sistema');
        }
    }

    async deleteSystem(id: string) {
        if (confirm('¿Está seguro de eliminar este sistema de CCTV?')) {
            try {
                await this.systemService.deleteSystem(id);
                this.toastService.success('Sistema eliminado');
            } catch (error) {
                this.toastService.error('Error al eliminar el sistema');
            }
        }
    }
}
