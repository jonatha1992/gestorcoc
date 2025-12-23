import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, ROLE_NAMES } from '../../models/user.model';
import { ToastService } from '../../services/toast.service';
import { LoaderComponent } from '../../components/ui/loader/loader';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './user-list.html',
})
export class UserListComponent {
    private userService = inject(UserService);
    private toastService = inject(ToastService);

    users$ = this.userService.getUsers();
    roles = Object.values(ROLE_NAMES);
    loading = false;

    async toggleUserStatus(user: User) {
        try {
            this.loading = true;
            await this.userService.toggleStatus(user.uid, user.isActive);
            this.toastService.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`);
        } catch (error) {
            this.toastService.error('Error al cambiar el estado del usuario');
            console.error(error);
        } finally {
            this.loading = false;
        }
    }

    async onRoleChange(user: User, event: any) {
        const newRole = event.target.value;
        try {
            this.loading = true;
            await this.userService.updateRoles(user.uid, [newRole]);
            this.toastService.success(`Rol actualizado a "${newRole}" correctamente`);
        } catch (error) {
            this.toastService.error('Error al actualizar el rol');
            console.error(error);
        } finally {
            this.loading = false;
        }
    }

    getRoleName(roleIds: string[]): string {
        return roleIds && roleIds.length > 0 ? roleIds[0] : 'Sin rol';
    }
}
