import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.html',
})
export class LoginPageComponent {
    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private loadingService = inject(LoadingService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    email = '';
    password = '';
    showPassword = signal(false);

    async login() {
        if (!this.email || !this.password) {
            this.toastService.error('Por favor, completa todos los campos');
            return;
        }

        this.loadingService.show();
        try {
            await this.authService.login(this.email, this.password);
            this.toastService.success('Bienvenido al sistema');

            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigateByUrl(returnUrl);
        } catch (error: any) {
            console.error('Login error:', error);
            this.toastService.error('Credenciales inválidas o error de conexión');
        } finally {
            this.loadingService.hide();
        }
    }

    togglePassword() {
        this.showPassword.update(v => !v);
    }

    async recoverAdmin() {
        try {
            this.loadingService.show();
            await this.authService.createInitialAdmin();
            this.toastService.success('Admin restaurado. Ingresando...');
            this.router.navigateByUrl('/');
        } catch (error: any) {
            this.toastService.error('Error: ' + error.message);
        } finally {
            this.loadingService.hide();
        }
    }
}
