import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { RolePermissionsService, RolePermission, PermissionInfo } from '../../services/role-permissions.service';
import { ToastService } from '../../services/toast.service';
import { PermissionCodes } from '../../auth/auth.models';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-permisos.html',
  providers: [RolePermissionsService]
})
export class RolesPermisosComponent implements OnInit {
  private rolePermissionsService = inject(RolePermissionsService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private confirmModalService = inject(ConfirmModalService);
  readonly authService = inject(AuthService);

  roles = signal<RolePermission[]>([]);
  selectedRole = signal<RolePermission | null>(null);
  isSubmitting = signal(false);
  expandedCategories = signal<Set<string>>(new Set(['Dashboard']));
  showCreateRoleModal = signal(false);
  newRoleName = '';
  newRoleLabel = '';
  newRolePermissions: string[] = [];

  get canManageUsers(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_USERS);
  }

  ngOnInit() {
    if (!this.canManageUsers) {
      this.toastService.show('No tiene permiso para gestionar roles.', 'warning');
      void this.router.navigate(['/']);
      return;
    }
    this.loadRoles();
  }

  loadRoles() {
    this.rolePermissionsService.getRoles().subscribe({
      next: (data) => {
        this.roles.set(data);
        if (data.length > 0 && !this.selectedRole()) {
          this.selectedRole.set(data[0]);
        }
      },
      error: () => {
        this.toastService.show('Error al cargar roles y permisos.', 'error');
      }
    });
  }

  selectRole(role: RolePermission) {
    this.selectedRole.set(role);
  }

  togglePermission(permission: string) {
    const current = this.selectedRole();
    if (!current) return;

    const permissions = [...current.permissions];
    const index = permissions.indexOf(permission);

    if (index === -1) {
      permissions.push(permission);
    } else {
      permissions.splice(index, 1);
    }

    this.selectedRole.set({ ...current, permissions });
  }

  hasPermission(role: RolePermission, permission: string): boolean {
    return role.permissions.includes(permission);
  }

  saveChanges() {
    const role = this.selectedRole();
    if (!role) return;

    this.isSubmitting.set(true);

    this.rolePermissionsService.updateRolePermissions(role.role, role.permissions).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.show(res.message, 'success');
        this.loadRoles();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail = err?.error?.detail || 'Error al guardar permisos.';
        this.toastService.show(detail, 'error');
      }
    });
  }

  toggleCategory(category: string) {
    const expanded = this.expandedCategories();
    const newSet = new Set(expanded);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    this.expandedCategories.set(newSet);
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories().has(category);
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'bg-rose-100 text-rose-700 border-rose-200',
      COORDINADOR_CREV: 'bg-purple-100 text-purple-700 border-purple-200',
      CREV: 'bg-violet-100 text-violet-700 border-violet-200',
      COORDINADOR_COC: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      OPERADOR: 'bg-sky-100 text-sky-700 border-sky-200',
      READ_ONLY: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return map[role] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  }

  getPermissionInfo(code: string): PermissionInfo {
    return this.rolePermissionsService.getPermissionInfo(code);
  }

  getPermissionsByCategory(allPermissions: string[]): Map<string, PermissionInfo[]> {
    return this.rolePermissionsService.getPermissionsByCategory(allPermissions);
  }

  getPermissionCountByCategory(permissions: string[], allPermissions: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const perm of permissions) {
      const info = this.getPermissionInfo(perm);
      const current = counts.get(info.category) || 0;
      counts.set(info.category, current + 1);
    }
    return counts;
  }

  openCreateRoleModal() {
    this.newRoleName = '';
    this.newRoleLabel = '';
    this.newRolePermissions = [];
    this.showCreateRoleModal.set(true);
  }

  closeCreateRoleModal() {
    this.showCreateRoleModal.set(false);
    this.newRoleName = '';
    this.newRoleLabel = '';
    this.newRolePermissions = [];
  }

  toggleNewRolePermission(permission: string) {
    const index = this.newRolePermissions.indexOf(permission);
    if (index === -1) {
      this.newRolePermissions.push(permission);
    } else {
      this.newRolePermissions.splice(index, 1);
    }
  }

  createRole() {
    if (!this.newRoleName.trim()) {
      this.toastService.show('El nombre del rol es requerido.', 'error');
      return;
    }

    if (!/^[A-Z][A-Z0-9_]*$/.test(this.newRoleName)) {
      this.toastService.show('El nombre debe comenzar con mayúscula y contener solo mayúsculas, números y guión bajo.', 'error');
      return;
    }

    if (this.newRolePermissions.length === 0) {
      this.toastService.show('Debe seleccionar al menos un permiso.', 'error');
      return;
    }

    this.isSubmitting.set(true);

    this.rolePermissionsService.createRole({
      role_name: this.newRoleName,
      role_label: this.newRoleLabel || this.newRoleName,
      permissions: this.newRolePermissions,
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.show(res.message, 'success');
        this.closeCreateRoleModal();
        this.loadRoles();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail = err?.error?.detail || 'Error al crear el rol.';
        this.toastService.show(detail, 'error');
      }
    });
  }

  async deleteRole() {
    const role = this.selectedRole();
    if (!role) return;

    try {
      await this.confirmModalService.confirmDelete(role.role, 'rol', 'Esta acción no se puede deshacer.');
      this.isSubmitting.set(true);

      this.rolePermissionsService.deleteRole(role.role).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.toastService.show(res.message, 'success');
          this.selectedRole.set(null);
          this.loadRoles();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const detail = err?.error?.detail || 'Error al eliminar el rol.';
          this.toastService.show(detail, 'error');
        }
      });
    } catch {
      // Usuario canceló
    }
  }

  getAllPermissions(): string[] {
    const selected = this.selectedRole();
    if (selected && selected.all_permissions && selected.all_permissions.length > 0) {
      return selected.all_permissions;
    }
    // Fallback: permisos hardcoded
    return [
      'view_dashboard', 'view_assets', 'manage_assets',
      'view_personnel', 'manage_personnel',
      'view_novedades', 'manage_novedades',
      'view_hechos', 'manage_hechos',
      'view_records', 'manage_records',
      'use_integrity_tools', 'verify_crev_record', 'manage_crev_flow',
      'view_settings', 'manage_users',
    ];
  }
}
