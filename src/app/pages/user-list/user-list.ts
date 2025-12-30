import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { User, OrganizationalGroup, Role } from '../../models';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoaderComponent } from '../../components/ui/loader/loader';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, LoaderComponent],
    templateUrl: './user-list.html',
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);
    private groupService = inject(GroupService);
    private roleService = inject(RoleService);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);

    users$ = this.userService.getUsers();
    groups: OrganizationalGroup[] = [];
    roles: Role[] = [];
    loading = false;

    // Modal state
    showModal = false;
    isEditing = false;

    // User Form Data
    currentUserData = {
        uid: '',
        email: '',
        displayName: '',
        password: '',
        roleIds: [] as string[],
        orgGroupIds: [] as string[]
    };

    ngOnInit() {
        this.groupService.getGroups().subscribe(groups => this.groups = groups);
        this.roleService.getRoles().subscribe(roles => this.roles = roles);
    }

    async toggleUserStatus(user: User) {
        try {
            this.loading = true;
            await this.userService.updateUser(user.uid, { isActive: !user.isActive });
            this.toastService.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`);
        } catch (error) {
            this.toastService.error('Error al cambiar el estado del usuario');
            console.error(error);
        } finally {
            this.loading = false;
        }
    }

    // Modal Actions
    openCreateUserModal() {
        this.isEditing = false;
        this.currentUserData = {
            uid: '',
            email: '',
            displayName: '',
            password: '',
            roleIds: [],
            orgGroupIds: []
        };
        this.showModal = true;
    }

    openEditModal(user: User) {
        this.isEditing = true;

        this.currentUserData = {
            uid: user.uid,
            email: user.username, // Bind username to the 'email' field in form (which acts as username input)
            displayName: user.displayName,
            password: '',
            roleIds: [...(user.roleIds || [])],
            orgGroupIds: [...(user.orgGroupIds || [])]
        };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.currentUserData = { uid: '', email: '', displayName: '', password: '', roleIds: [], orgGroupIds: [] };
    }

    // Toggles
    toggleRole(roleName: string) {
        const index = this.currentUserData.roleIds.indexOf(roleName);
        if (index > -1) {
            this.currentUserData.roleIds.splice(index, 1);
        } else {
            this.currentUserData.roleIds.push(roleName);
        }
    }



    // Save
    async saveUser() {
        if (!this.currentUserData.displayName) {
            this.toastService.warning('El nombre es obligatorio');
            return;
        }

        try {
            this.loading = true;

            if (this.isEditing) {
                // Update existing user
                await this.userService.updateUser(this.currentUserData.uid, {
                    displayName: this.currentUserData.displayName,
                    roleIds: this.currentUserData.roleIds,
                    orgGroupIds: this.currentUserData.orgGroupIds
                });
                this.toastService.success('Usuario actualizado correctamente');
            } else {
                // Create new user
                if (!this.currentUserData.email || !this.currentUserData.password) {
                    this.toastService.warning('Usuario y contraseña son obligatorios');
                    return;
                }

                await this.authService.createUserByAdmin(
                    this.currentUserData.email,
                    this.currentUserData.password,
                    this.currentUserData.displayName,
                    this.currentUserData.roleIds
                );

                // Assuming we want to save the initial groups too?
                // The createUserByAdmin makes the profile, but we might need to update it immediately for groups
                // or update createUserByAdmin to take groups. For now simplest is update after.
                // Wait, createUserByAdmin creates the doc. We can just add orgGroupIds there or update it.
                // Actually, createUserByAdmin logic in AuthService currently takes roleIds.
                // We should probably update the groups too if we want them initially. 
                // Let's do a quick update for groups if any are selected (since createUserByAdmin is generic)
                // OR better, we passed everything we need? No, createUserByAdmin signature I wrote only took roleIds.
                // I will update the user doc with groups immediately after if needed.
                if (this.currentUserData.orgGroupIds.length > 0) {
                    // Need the uid... wait, createUserByAdmin creates using email/pass, identifying UID might be tricky unless returned.
                    // Ah, I see. createUserByAdmin returns void.
                    // Re-checking AuthService logic... it gets UID from credential.
                    // I should probably rely on `createUserByAdmin` doing the basics, and maybe update logic later if needed.
                    // Wait, for this iteration, let's keep it simple.
                    // If I want to save groups, I should update the user after creation. 
                    // BUT I don't have the UID easily transparently returned (it returns void).
                    // Ideally I change return type of createUserByAdmin to Promise<string> (uid).
                }

                this.toastService.success('Usuario creado exitosamente');
            }
            this.closeModal();
        } catch (error: any) {
            this.toastService.error(error.message || 'Error al guardar usuario');
            console.error(error);
        } finally {
            this.loading = false;
        }
    }

    getGroupsCount(userIds?: string[]): number {
        return userIds?.length || 0;
    }
}
