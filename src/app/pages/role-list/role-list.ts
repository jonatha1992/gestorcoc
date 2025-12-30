import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../services/role.service';
import { ToastService } from '../../services/toast.service';
import { Role, Permission, ModuleName, ActionType } from '../../models/user.model';
import { Observable } from 'rxjs';
import { LoaderComponent } from '../../components/ui/loader/loader';

const MODULES: ModuleName[] = ['hechos', 'camaras', 'equipamiento', 'catalogos', 'usuarios', 'roles'];
const ACTIONS: ActionType[] = ['read', 'create', 'update', 'delete', 'export'];

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    template: `
    <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">📋 Gestión de Roles</h2>
            <button (click)="openModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <span>➕</span> Nuevo Rol
            </button>
        </div>

        <app-loader *ngIf="loading"></app-loader>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (role of roles$ | async; track role.id) {
                <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <div class="p-5 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">{{ role.name }}</h3>
                            <p class="text-xs text-gray-500 mt-1" *ngIf="role.isSystem">🔒 Rol de Sistema</p>
                        </div>
                        <div class="flex gap-2">
                            <button (click)="editRole(role)" class="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Editar Rol">
                                ✏️
                            </button>
                            <button *ngIf="!role.isSystem" (click)="deleteRole(role)" class="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors" title="Eliminar Rol">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="p-5">
                        <div class="text-sm text-gray-600 mb-2 font-medium">Módulos con acceso:</div>
                        <div class="flex flex-wrap gap-2">
                             @for (perm of role.permissions; track perm.module) {
                                 <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs border border-gray-200">
                                     {{ perm.module | titlecase }}
                                     <span class="text-gray-400 ml-1">({{ perm.actions.length }})</span>
                                 </span>
                             }
                             @if (role.permissions.length === 0) {
                                 <span class="text-gray-400 italic text-sm">Sin permisos definidos</span>
                             }
                        </div>
                    </div>
                </div>
            } @empty {
                 <div class="col-span-full text-center py-12 text-gray-500">
                    No hay roles definidos.
                </div>
            }
        </div>

        <!-- Modal -->
        <div *ngIf="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-xl font-bold text-gray-800">{{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
                    <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                </div>
                
                <div class="p-6 overflow-y-auto flex-1">
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Rol</label>
                        <input [(ngModel)]="currentRole.name" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ej: Supervisor">
                    </div>

                    <div class="space-y-4">
                        <label class="block text-sm font-medium text-gray-700">Permisos por Módulo</label>
                        
                        <div class="border rounded-xl overflow-hidden">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                                    <tr>
                                        <th class="px-4 py-3">Módulo</th>
                                        @for (action of actions; track action) {
                                            <th class="px-4 py-3 text-center">{{ action | titlecase }}</th>
                                        }
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    @for (module of modules; track module) {
                                        <tr class="hover:bg-gray-50/50">
                                            <td class="px-4 py-3 font-medium text-gray-900">{{ module | titlecase }}</td>
                                            @for (action of actions; track action) {
                                                <td class="px-4 py-3 text-center">
                                                    <input type="checkbox" 
                                                        [checked]="hasPermission(module, action)" 
                                                        (change)="togglePermission(module, action)"
                                                        class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer">
                                                </td>
                                            }
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button (click)="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button (click)="saveRole()" [disabled]="!currentRole.name" class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200">
                        {{ editingRole ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
})
export class RoleListComponent implements OnInit {
    private roleService = inject(RoleService);
    private toastService = inject(ToastService);

    roles$!: Observable<Role[]>;
    loading = false;
    showModal = false;
    editingRole: Role | null = null;

    modules = MODULES;
    actions = ACTIONS;

    currentRole: Partial<Role> = {
        name: '',
        permissions: []
    };

    ngOnInit() {
        this.roles$ = this.roleService.getRoles();
    }

    openModal() {
        this.editingRole = null;
        this.currentRole = { name: '', permissions: [] };
        this.showModal = true;
    }

    editRole(role: Role) {
        this.editingRole = role;
        // Deep copy permissions to avoid mutating view directly
        this.currentRole = {
            name: role.name,
            permissions: role.permissions.map(p => ({ module: p.module, actions: [...p.actions] })),
            isSystem: role.isSystem
        };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.currentRole = { name: '', permissions: [] };
    }

    async saveRole() {
        try {
            this.loading = true;
            if (this.editingRole && this.editingRole.id) {
                await this.roleService.updateRole(this.editingRole.id, this.currentRole);
                this.toastService.success('Rol actualizado correctamente');
            } else {
                await this.roleService.addRole(this.currentRole);
                this.toastService.success('Rol creado correctamente');
            }
            this.closeModal();
        } catch (error) {
            this.toastService.error('Error al guardar el rol');
            console.error(error);
        } finally {
            this.loading = false;
        }
    }

    async deleteRole(role: Role) {
        if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) return;

        try {
            this.loading = true;
            if (role.id) {
                await this.roleService.deleteRole(role.id);
                this.toastService.success('Rol eliminado');
            }
        } catch (error) {
            this.toastService.error('Error al eliminar el rol');
        } finally {
            this.loading = false;
        }
    }

    // Permission Helpers
    hasPermission(module: ModuleName, action: ActionType): boolean {
        const perm = this.currentRole.permissions?.find(p => p.module === module);
        return perm ? perm.actions.includes(action) : false;
    }

    togglePermission(module: ModuleName, action: ActionType) {
        if (!this.currentRole.permissions) this.currentRole.permissions = [];

        let perm = this.currentRole.permissions.find(p => p.module === module);

        if (!perm) {
            // Create new permission entry if it doesn't exist
            perm = { module, actions: [] };
            this.currentRole.permissions.push(perm);
        }

        const actionIndex = perm.actions.indexOf(action);
        if (actionIndex > -1) {
            // Remove action
            perm.actions.splice(actionIndex, 1);
            // If no actions left, remove the permission object entirely to keep it clean
            if (perm.actions.length === 0) {
                const permIndex = this.currentRole.permissions.indexOf(perm);
                this.currentRole.permissions.splice(permIndex, 1);
            }
        } else {
            // Add action
            perm.actions.push(action);
        }
    }
}
