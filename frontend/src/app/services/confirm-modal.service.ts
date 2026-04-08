import { Injectable, signal, computed } from '@angular/core';
import { ConfirmModalOptions } from '../components/confirm-modal.component';

export interface ConfirmDialogConfig extends ConfirmModalOptions {
    onConfirm: () => void;
    onCancel?: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmModalService {
    private configSignal = signal<ConfirmDialogConfig | null>(null);
    
    visible = computed(() => this.configSignal() !== null);
    config = computed(() => this.configSignal());

    /**
     * Muestra un modal de confirmación
     * @param options Configuración del modal
     * @returns Promise que se resuelve si el usuario confirma, o se rechaza si cancela
     */
    confirm(options: ConfirmModalOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            this.configSignal.set({
                ...options,
                onConfirm: () => {
                    resolve();
                    this.close();
                },
                onCancel: () => {
                    reject('cancelled');
                    this.close();
                }
            });
        });
    }

    /**
     * Muestra un modal de confirmación simplificado para eliminaciones
     * @param itemName Nombre del elemento a eliminar
     * @param itemType Tipo de elemento (sistema, cámara, servidor, etc.)
     * @param warningText Texto de advertencia opcional
     * @returns Promise que se resuelve si el usuario confirma
     */
    confirmDelete(itemName: string, itemType: string = 'elemento', warningText?: string): Promise<void> {
        return this.confirm({
            title: `Eliminar ${itemType}`,
            message: `¿Está seguro que desea eliminar "${itemName}"?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            showWarning: !!warningText,
            warningText: warningText,
            confirmButtonClass: 'text-white bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
        });
    }

    /**
     * Cierra el modal actual sin llamar a ningún callback
     */
    close(): void {
        this.configSignal.set(null);
    }

    /**
     * Ejecuta el callback de confirmación y cierra el modal
     */
    handleConfirm(): void {
        const config = this.configSignal();
        if (config) {
            config.onConfirm();
        }
    }

    /**
     * Ejecuta el callback de cancelación y cierra el modal
     */
    handleCancel(): void {
        const config = this.configSignal();
        if (config?.onCancel) {
            config.onCancel();
        } else {
            this.close();
        }
    }
}
