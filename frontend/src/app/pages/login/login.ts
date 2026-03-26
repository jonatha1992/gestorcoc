import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  errorMessage = signal('');
  isSubmitting = signal(false);
  showPassword = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update((current) => !current);
  }

  submit() {
    if (!this.username.trim() || !this.password) {
      this.errorMessage.set('Debe ingresar usuario y contraseña.');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (response) => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        const target = response.user.must_change_password ? '/settings' : redirectTo || '/';
        void this.router.navigateByUrl(target);
      },
      error: () => {
        this.errorMessage.set('Credenciales invalidas o usuario sin acceso.');
        this.isSubmitting.set(false);
      },
      complete: () => this.isSubmitting.set(false),
    });
  }
}
