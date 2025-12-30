import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { User, ROLE_NAMES, OrganizationalGroup } from '../../models';
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
    private groupService = inject(GroupService);
    private toastService = inject(ToastService);

    users$ = this.userService.getUsers();
    groups: OrganizationalGroup[] = [];
    roles = Object.values(ROLE_NAMES);
    loading = false;

    // Modal state
    selectedUser: User | null = null;
    showGroupsModal = false;
    userGroups: string[] = [];

    ngOnInit() {
        this.groupService.getGroups().subscribe(groups => this.groups = groups);
    }

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

    openGroupsModal(user: User) {
        this.selectedUser = user;
        this.userGroups = [...(user.orgGroupIds || [])];
        this.showGroupsModal = true;
    }

    toggleGroup(groupId: string) {
        const index = this.userGroups.indexOf(groupId);
        if (index > -1) {
            this.userGroups.splice(index, 1);
        } else {
            this.userGroups.push(groupId);
        }
    }

    async saveUserGroups() {
        if (!this.selectedUser) return;

        try {
            this.loading = true;
            await this.userService.updateUser(this.selectedUser.uid, { orgGroupIds: this.userGroups });
            this.toastService.success('Grupos de acceso actualizados');
            this.showGroupsModal = false;
        } catch (error) {
            this.toastService.error('Error al actualizar los grupos');
        } finally {
            this.loading = false;
        }
    }

    getGroupsCount(userIds?: string[]): number {
        return userIds?.length || 0;
    }

    getGroupName(groupId: string): string {
        return this.groups.find(g => g.id === groupId)?.name || 'Grupo Desconocido';
    }
}
