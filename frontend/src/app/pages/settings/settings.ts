import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

type PasswordField = 'old_password' | 'new_password' | 'new_password_confirm';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html'
})
export class SettingsComponent {
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal('');
  readonly passwordVisibility = signal<Record<PasswordField, boolean>>({
    old_password: false,
    new_password: false,
    new_password_confirm: false,
  });

  passwordForm = {
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  };

  isPasswordVisible(field: PasswordField): boolean {
    return this.passwordVisibility()[field];
  }

  togglePasswordVisibility(field: PasswordField) {
    this.passwordVisibility.update((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  submitPasswordChange() {
    if (this.isSubmitting()) {
      return;
    }

    if (
      !this.passwordForm.old_password ||
      !this.passwordForm.new_password ||
      !this.passwordForm.new_password_confirm
    ) {
      this.toastService.error('Complete todos los campos para cambiar la contrasena.');
      return;
    }

    const mustRedirect = !!this.authService.user()?.must_change_password;
    this.isSubmitting.set(true);
    this.successMessage.set('');

    this.authService
      .changePassword(this.passwordForm)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm = {
            old_password: '',
            new_password: '',
            new_password_confirm: '',
          };
          this.passwordVisibility.set({
            old_password: false,
            new_password: false,
            new_password_confirm: false,
          });
          this.successMessage.set('Contrasena actualizada correctamente.');
          this.toastService.success('Contrasena actualizada correctamente.');
          if (mustRedirect) {
            void this.router.navigate(['/']);
          }
        },
        error: (error) => {
          const detail =
            error?.error?.old_password?.[0] ||
            error?.error?.new_password?.[0] ||
            error?.error?.new_password_confirm?.[0] ||
            error?.error?.non_field_errors?.[0] ||
            error?.error?.detail ||
            'No se pudo actualizar la contrasena.';
          this.toastService.error(detail);
        },
      });
  }
}

