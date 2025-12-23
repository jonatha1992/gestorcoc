import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ModuleName, ActionType } from '../models/user.model';

/**
 * Structural directive to conditionally show content based on user permissions
 * Usage: <div *appHasPermission="['equipamiento', 'create']">...</div>
 */
@Directive({
    selector: '[appHasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private authService = inject(AuthService);
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);

    private module?: ModuleName;
    private action?: ActionType;

    @Input('appHasPermission') set permission(value: [ModuleName, ActionType]) {
        this.module = value[0];
        this.action = value[1];
        this.updateView();
    }

    constructor() {
        // Automatically update view when user state changes
        effect(() => {
            this.authService.user(); // Trigger effect on user change
            this.updateView();
        });
    }

    private updateView() {
        if (!this.module || !this.action) {
            this.viewContainer.clear();
            return;
        }

        if (this.authService.hasPermission(this.module, this.action)) {
            if (this.viewContainer.length === 0) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
        } else {
            this.viewContainer.clear();
        }
    }
}
