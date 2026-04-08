import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../services/layout.service';
import { AuditService, AuditLogFilters } from '../../services/audit.service';
import { ToastService } from '../../services/toast.service';
// import { trigger, transition, style, animate } from '@angular/animations';

interface AuditLog {
    id: number;
    action: string;
    username: string;
    role: string;
    target_model: string;
    target_repr: string;
    path: string;
    method: string;
    status_code: number;
    ip_address: string;
    created_at: string;
    message: string;
    changes?: any;
    metadata?: any;
}

@Component({
    selector: 'app-sistema',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sistema.component.html',
    // animations removidas temporalmente
})
export class SistemaComponent implements OnInit {
    private layoutService = inject(LayoutService);
    private auditService = inject(AuditService);
    private toast = inject(ToastService);

    logs = signal<AuditLog[]>([]);
    isLoading = signal<boolean>(true);
    totalCount = signal<number>(0);
    currentPage = signal<number>(1);
    totalPages = signal<number>(1);
    
    // Filtros
    searchQuery = signal<string>('');
    filterAction = signal<string>('');
    filterModel = signal<string>('');

    // Modal de detalle
    selectedLog = signal<AuditLog | null>(null);

    ngOnInit() {
        // this.layoutService.setTitle('Sistema y Auditoría'); 
        this.loadLogs();
    }

    loadLogs(page: number = 1) {
        this.isLoading.set(true);
        const filters: AuditLogFilters = {
            page: page,
            search: this.searchQuery(),
            action: this.filterAction() !== '' ? this.filterAction() : undefined,
            target_model: this.filterModel() !== '' ? this.filterModel() : undefined,
        };

        this.auditService.getLogs(filters).subscribe({
            next: (response) => {
                this.logs.set(response.results);
                this.totalCount.set(response.count);
                this.totalPages.set(Math.ceil(response.count / 50)); // Backend usa page_size 50
                this.currentPage.set(page);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error fetching logs', err);
                this.toast.error('Error al cargar logs del sistema');
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        this.loadLogs(1);
    }

    clearFilters() {
        this.searchQuery.set('');
        this.filterAction.set('');
        this.filterModel.set('');
        this.loadLogs(1);
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.totalPages()) {
            this.loadLogs(newPage);
        }
    }

    openDetail(log: AuditLog) {
        this.selectedLog.set(log);
    }

    closeDetail() {
        this.selectedLog.set(null);
    }

    getStatusClass(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (statusCode >= 400 && statusCode < 500) return 'text-amber-700 bg-amber-50 border-amber-200';
        if (statusCode >= 500) return 'text-rose-700 bg-rose-50 border-rose-200';
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }

    getActionClass(action: string): string {
        switch (action) {
            case 'login': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'logout': return 'text-slate-600 bg-slate-100 border-slate-300';
            case 'create': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'update': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'delete': return 'text-rose-700 bg-rose-50 border-rose-200';
            case 'read': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    }

    formatChanges(changes: any): string {
        if (!changes || Object.keys(changes).length === 0) return 'Sin cambios estructurales';
        return JSON.stringify(changes, null, 2);
    }
}
