import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupService, UnitService, CctvSystemService, ToastService } from '../../../services';
import { OrganizationalGroup, Unit, CctvSystem, ROLE_NAMES } from '../../../models';
import { LoaderComponent } from '../../../components/ui/loader/loader';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-group-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LoaderComponent],
    templateUrl: './group-list.html'
})
export class GroupListComponent implements OnInit {
    private groupService = inject(GroupService);
    private unitService = inject(UnitService);
    private systemService = inject(CctvSystemService);
    private toastService = inject(ToastService);

    groups$!: Observable<OrganizationalGroup[]>;
    units: Unit[] = [];
    systems: CctvSystem[] = [];
    availableRoles = Object.values(ROLE_NAMES);
    isLoading = true;
    showModal = false;
    isEditing = false;

    currentGroup: Partial<OrganizationalGroup> = {
        name: '',
        description: '',
        unitIds: [],
        systemIds: [],
        roleId: ROLE_NAMES.CONSULTA // Default role
    };

    ngOnInit() {
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            this.unitService.getUnits().subscribe(u => this.units = u);
            this.systemService.getSystems().subscribe(s => this.systems = s);
            this.groups$ = this.groupService.getGroups();
            this.groups$.subscribe({
                next: () => this.isLoading = false,
                error: () => {
                    this.isLoading = false;
                    this.toastService.error('Error al cargar los grupos');
                }
            });
        } catch (error) {
            this.isLoading = false;
            this.toastService.error('Error al inicializar la página');
        }
    }

    toggleUnitSelection(unitId: string) {
        const index = this.currentGroup.unitIds!.indexOf(unitId);
        if (index > -1) {
            this.currentGroup.unitIds!.splice(index, 1);
        } else {
            this.currentGroup.unitIds!.push(unitId);
        }
    }

    toggleSystemSelection(systemId: string) {
        const index = this.currentGroup.systemIds!.indexOf(systemId);
        if (index > -1) {
            this.currentGroup.systemIds!.splice(index, 1);
        } else {
            this.currentGroup.systemIds!.push(systemId);
        }
    }

    openCreateModal() {
        this.isEditing = false;
        this.currentGroup = {
            name: '',
            description: '',
            unitIds: [],
            systemIds: [],
            roleId: ROLE_NAMES.CONSULTA
        };
        this.showModal = true;
    }

    openEditModal(group: OrganizationalGroup) {
        this.isEditing = true;
        this.currentGroup = {
            ...group,
            unitIds: [...(group.unitIds || [])],
            systemIds: [...(group.systemIds || [])],
            roleId: group.roleId || ROLE_NAMES.CONSULTA
        };
        this.showModal = true;
    }

    async saveGroup() {
        if (!this.currentGroup.name) {
            this.toastService.warning('El nombre es obligatorio');
            return;
        }

        try {
            if (this.isEditing && this.currentGroup.id) {
                await this.groupService.updateGroup(this.currentGroup as OrganizationalGroup);
                this.toastService.success('Grupo actualizado');
            } else {
                await this.groupService.addGroup(this.currentGroup as OrganizationalGroup);
                this.toastService.success('Grupo creado');
            }
            this.showModal = false;
        } catch (error) {
            this.toastService.error('Error al guardar el grupo');
        }
    }

    async deleteGroup(id: string) {
        if (confirm('¿Está seguro de eliminar este grupo?')) {
            try {
                await this.groupService.deleteGroup(id);
                this.toastService.success('Grupo eliminado');
            } catch (error) {
                this.toastService.error('Error al eliminar el grupo');
            }
        }
    }

    getUnitName(unitId: string | undefined): string {
        if (!unitId) return '-';
        return this.units.find(u => u.id === unitId)?.name || 'Unidad no encontrada';
    }
}
