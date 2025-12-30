import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HechoService } from '../../services/hecho.service';
import { Hecho } from '../../models/hecho.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
    selector: 'app-hecho-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <!-- Header -->
            <div class="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                    <span>{{ isEditing ? '✏️ Editar Hecho' : '📝 Nuevo Hecho' }}</span>
                </h2>
                <button routerLink="/hechos" class="text-indigo-100 hover:text-white transition-colors text-2xl font-bold">&times;</button>
            </div>

            <form (ngSubmit)="save()" class="p-8 space-y-6">
                <!-- Seccion 1: Identificación y Origen -->
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Datos Principales</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nro de Orden</label>
                            <input [(ngModel)]="hecho.nroOrden" name="nroOrden" type="number" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" placeholder="Ej: 1024" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Intervención</label>
                            <input [ngModel]="fechaInput" (ngModelChange)="updateDate($event)" name="fecha" type="datetime-local" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Quien Detecta</label>
                            <select [(ngModel)]="hecho.quienDetecta" name="quienDetecta" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                                <option value="Guardia de Prevención">👮 Guardia de Prevención</option>
                                <option value="Centro Monitoreo">🖥️ Centro Monitoreo</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                            <input [(ngModel)]="hecho.sector" name="sector" type="text" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" placeholder="Ej: Pabellón 3">
                        </div>
                    </div>
                </div>

                <!-- Seccion 2: Detalle del Hecho -->
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Clasificación y Detalle</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Novedad (Catálogo)</label>
                            <!-- TODO: Cargar desde CatalogService -->
                            <select [(ngModel)]="hecho.novedad" name="novedad" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                                <option value="" disabled>Seleccione...</option>
                                <option value="Riña">Riña</option>
                                <option value="Requisa">Requisa</option>
                                <option value="Traslado">Traslado</option>
                                <option value="Incendio">Incendio</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Elementos (Catálogo)</label>
                            <!-- TODO: Cargar desde CatalogService -->
                            <select [(ngModel)]="hecho.elementos" name="elementos" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                                <option value="" disabled>Seleccione...</option>
                                <option value="Faca">Faca</option>
                                <option value="Celular">Celular</option>
                                <option value="Estupefacientes">Estupefacientes</option>
                                <option value="Ninguno">Ninguno</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                            <textarea [(ngModel)]="hecho.observaciones" name="observaciones" rows="3" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" placeholder="Detalles adicionales del hecho..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Seccion 3: Resolución -->
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Resolución y Cierre</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center gap-4">
                            <div class="flex items-center">
                                <input [(ngModel)]="hecho.solucionadoCOC" name="solucionadoCOC" type="checkbox" id="solucionadoCOC" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                                <label for="solucionadoCOC" class="ml-2 block text-sm text-gray-900">Solucionado intervención COC</label>
                            </div>
                            <div class="flex items-center">
                                <input [(ngModel)]="hecho.generoCausa" name="generoCausa" type="checkbox" id="generoCausa" class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
                                <label for="generoCausa" class="ml-2 block text-sm text-gray-900 font-medium text-red-700">Generó Causa</label>
                            </div>
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hs Resolución</label>
                            <input [(ngModel)]="hecho.hsResolucion" name="hsResolucion" type="text" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" placeholder="Ej: 2hs 30min">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Detalle Cierre</label>
                            <textarea [(ngModel)]="hecho.detalleCierre" name="detalleCierre" rows="2" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sugerencia</label>
                            <input [(ngModel)]="hecho.sugerencia" name="sugerencia" type="text" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Falencia</label>
                            <input [(ngModel)]="hecho.falencia" name="falencia" type="text" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm">
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button routerLink="/hechos" type="button" class="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" [disabled]="loading" class="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar Hecho' : 'Crear Hecho') }}
                    </button>
                </div>
            </form>
        </div>
    </div>
    `
})
export class HechoFormComponent implements OnInit {
    private hechoService = inject(HechoService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private toastService = inject(ToastService);

    isEditing = false;
    loading = false;
    hechoId: string | null = null;
    fechaInput: string = new Date().toISOString().slice(0, 16);

    hecho: Partial<Hecho> = {
        nroOrden: 0,
        quienDetecta: 'Guardia de Prevención',
        solucionadoCOC: false,
        generoCausa: false,
        novedad: '',
        elementos: ''
    };

    async ngOnInit() {
        this.hechoId = this.route.snapshot.paramMap.get('id');
        if (this.hechoId) {
            this.isEditing = true;
            this.loading = true;
            try {
                const data = await this.hechoService.getHecho(this.hechoId);
                if (data) {
                    this.hecho = data;
                    // Format date for input
                    if (data.fechaIntervencion) {
                        this.fechaInput = data.fechaIntervencion.toDate().toISOString().slice(0, 16);
                    }
                }
            } catch (err) {
                console.error(err);
                this.toastService.error('Error al cargar datos');
            } finally {
                this.loading = false;
            }
        }
    }

    updateDate(value: string) {
        this.fechaInput = value;
    }

    async save() {
        this.loading = true;
        try {
            // Convert inputs
            const finalData = {
                ...this.hecho,
                fechaIntervencion: Timestamp.fromDate(new Date(this.fechaInput)),
                updatedBy: this.authService.getCurrentUserId()
            };

            if (this.isEditing && this.hechoId) {
                await this.hechoService.updateHecho(this.hechoId, finalData);
                this.toastService.success('Hecho actualizado');
            } else {
                await this.hechoService.addHecho({
                    ...finalData,
                    createdAt: Timestamp.now(),
                    createdBy: this.authService.getCurrentUserId() || 'unknown',
                    novedad: finalData.novedad || 'Sin novedad', // Fallback
                    elementos: finalData.elementos || 'Ninguno',
                    sector: finalData.sector || '',
                    hsResolucion: finalData.hsResolucion || '',
                    detalleCierre: finalData.detalleCierre || '',
                    sugerencia: finalData.sugerencia || '',
                    falencia: finalData.falencia || '',
                    observaciones: finalData.observaciones || '',
                    solucionadoCOC: !!finalData.solucionadoCOC,
                    generoCausa: !!finalData.generoCausa,
                    quienDetecta: finalData.quienDetecta as any,
                    nroOrden: finalData.nroOrden || 0,
                    fechaIntervencion: finalData.fechaIntervencion as Timestamp
                } as Hecho);
                this.toastService.success('Hecho creado');
            }
            this.router.navigate(['/hechos']);
        } catch (error) {
            console.error(error);
            this.toastService.error('Error al guardar');
        } finally {
            this.loading = false;
        }
    }
}
