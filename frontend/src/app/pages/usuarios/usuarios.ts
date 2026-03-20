import { Component, OnInit, inject, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PermissionCodes, RoleLabels } from '../../auth/auth.models';
import { AuthService } from '../../services/auth.service';
import { AssetService, Unit } from '../../services/asset.service';
import { UserManagementService, SystemUser } from '../../services/user-management.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  providers: [UserManagementService, AssetService]
})
export class UsuariosComponent implements OnInit {
  private userMgmtService = inject(UserManagementService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);
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

  users = signal<SystemUser[]>([]);
  units = signal<Unit[]>([]);
  showForm = signal(false);
  showPasswordModal = signal(false);
  isEditing = false;
  searchText = '';
  filterRole = '';
  filterUnit = '';

  currentPage = 1;
  totalCount = 0;
  pageSize = 50;
  get totalPages() { return Math.ceil(this.totalCount / this.pageSize); }

  private searchTimer: any;
  currentUser: any = this.getEmptyUser();
  selectedUserId: number | null = null;
  newPassword = '';
  passwordConfirm = '';

  get canManageUsers(): boolean {
    return this.authService.hasPermission(PermissionCodes.MANAGE_USERS);
  }

  ngOnInit() {
    this.loadUnits();
    this.loadUsers();
  }

  loadUnits() {
    this.assetService.getUnits().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          const results = (data as any)?.results ?? data;
          const sorted = [...(results || [])].sort((a: Unit, b: Unit) =>
            (a.name || '').localeCompare((b.name || ''), 'es', { sensitivity: 'base' })
          );
          this.units.set(sorted);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Error al cargar unidades', 'error');
        });
      }
    });
  }

  loadUsers() {
    this.userMgmtService.getUsers(this.currentPage, this.searchText, this.filterRole, this.filterUnit).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          const results = (data as any)?.results ?? data;
          this.users.set(results);
          this.totalCount = (data as any)?.count ?? results.length;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Error al cargar usuarios', 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadUsers();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.filterRole = '';
    this.filterUnit = '';
    this.onFilterChange();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
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

  openForm() {
    this.isEditing = false;
    this.currentUser = this.getEmptyUser();
    this.showForm.set(true);
  }

  editUser(user: SystemUser) {
    this.isEditing = true;
    this.currentUser = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      badge_number: user.badge_number,
      role: user.role,
      rank: user.rank,
      unit: user.unit || '',
      is_active: user.is_active,
      user_is_active: user.user_is_active,
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.currentUser = this.getEmptyUser();
  }

  saveUser() {
    const request = this.isEditing
      ? this.userMgmtService.updateUser(this.currentUser.id, this.currentUser)
      : this.userMgmtService.createUser(this.currentUser);

    request.subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show(this.isEditing ? 'Usuario actualizado' : 'Usuario creado correctamente', 'success');
          this.closeForm();
          this.loadUsers();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          const msg = this.extractError(err);
          this.toastService.show(msg, 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  toggleActive(user: SystemUser) {
    this.userMgmtService.toggleActive(user.id).subscribe({
      next: (result) => {
        this.ngZone.run(() => {
          this.toastService.show(result.is_active ? 'Usuario activado' : 'Usuario desactivado', 'success');
          this.loadUsers();
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

  openPasswordModal(user: SystemUser) {
    this.selectedUserId = user.id;
    this.newPassword = '';
    this.passwordConfirm = '';
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
    this.selectedUserId = null;
    this.newPassword = '';
    this.passwordConfirm = '';
  }

  submitPasswordReset() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.toastService.show('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (this.newPassword !== this.passwordConfirm) {
      this.toastService.show('Las contraseñas no coinciden', 'error');
      return;
    }
    this.userMgmtService.resetPassword(this.selectedUserId!, this.newPassword).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show('Contraseña restablecida. El usuario deberá cambiarla al iniciar sesión.', 'success');
          this.closePasswordModal();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Error al restablecer contraseña', 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  getRoleLabel(role: string): string {
    return this.ROLE_LABELS[role] ?? role;
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'bg-rose-100 text-rose-700 border-rose-200',
      COORDINADOR_COC: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      COORDINADOR_CREV: 'bg-purple-100 text-purple-700 border-purple-200',
      CREV: 'bg-violet-100 text-violet-700 border-violet-200',
      OPERADOR: 'bg-sky-100 text-sky-700 border-sky-200',
    };
    return map[role] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  }

  formatLastLogin(dateStr: string | null): string {
    if (!dateStr) return 'Nunca';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  onBadgeNumberInput() {
    const raw = String(this.currentUser.badge_number ?? '');
    this.currentUser.badge_number = raw.replace(/\D/g, '').slice(0, 6);
  }

  private getEmptyUser() {
    return {
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      badge_number: '',
      role: 'OPERADOR',
      rank: 'CIVIL',
      unit: '',
      is_active: true,
      user_is_active: true,
    };
  }

  private extractError(err: any): string {
    if (err?.error) {
      const fields = Object.entries(err.error as Record<string, any>);
      if (fields.length > 0) {
        const [, msgs] = fields[0];
        return Array.isArray(msgs) ? msgs[0] : String(msgs);
      }
    }
    return 'Error al guardar usuario';
  }
}
