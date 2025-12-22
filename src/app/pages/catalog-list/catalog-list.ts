import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { LoaderComponent } from '../../components/ui/loader/loader';
import { Catalog, CatalogItem, CATALOG_CODES } from '../../models';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CATALOG_SEED_DATA } from '../../seed/seed-catalogs';

@Component({
    selector: 'app-catalog-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './catalog-list.html',
})
export class CatalogListComponent implements OnInit {
    private catalogService = inject(CatalogService);
    private toast = inject(ToastService);
    private confirm = inject(ConfirmService);

    catalogs$ = this.catalogService.getCatalogs();
    selectedCatalog: Catalog | null = null;
    catalogItems$!: Observable<CatalogItem[]>;

    // Estados
    isLoading = false;
    isSeeding = false;

    // Para nuevo catálogo
    showNewCatalogForm = false;
    newCatalogName = '';
    newCatalogCode = '';

    // Para nuevo item
    showNewItemForm = false;
    newItemName = '';

    ngOnInit() { }


    selectCatalog(catalog: Catalog) {
        this.selectedCatalog = catalog;
        if (catalog.id) {
            this.catalogItems$ = this.catalogService.getItemsByCatalogId(catalog.id);
        }
    }

    async addCatalog() {
        if (!this.newCatalogName.trim() || !this.newCatalogCode.trim()) return;

        this.isLoading = true;
        try {
            const catalog: Catalog = {
                name: this.newCatalogName,
                code: this.newCatalogCode.toUpperCase(),
                isActive: true,
                createdAt: Timestamp.now(),
                createdBy: 'system'
            };

            await this.catalogService.addCatalog(catalog);
            this.toast.success('Catálogo creado correctamente');
            this.newCatalogName = '';
            this.newCatalogCode = '';
            this.showNewCatalogForm = false;
        } catch (error) {
            this.toast.error('Error al crear el catálogo');
        } finally {
            this.isLoading = false;
        }
    }

    async addItem() {
        if (!this.newItemName.trim() || !this.selectedCatalog?.id) return;

        this.isLoading = true;
        try {
            const item: CatalogItem = {
                catalogId: this.selectedCatalog.id,
                name: this.newItemName,
                order: 0,
                isActive: true,
                createdAt: Timestamp.now(),
                createdBy: 'system'
            };

            await this.catalogService.addItem(item);
            this.toast.success(`Ítem "${this.newItemName}" agregado`);
            this.newItemName = '';
            this.showNewItemForm = false;
            // Refrescar items
            this.catalogItems$ = this.catalogService.getItemsByCatalogId(this.selectedCatalog.id);
        } catch (error) {
            this.toast.error('Error al agregar el ítem');
        } finally {
            this.isLoading = false;
        }
    }

    async deleteItem(id: string) {
        const confirmed = await this.confirm.ask({
            title: '¿Eliminar ítem?',
            message: 'Esta acción no se puede deshacer.',
            type: 'danger',
            confirmText: 'Eliminar'
        });

        if (confirmed) {
            try {
                await this.catalogService.deleteItem(id);
                this.toast.success('Ítem eliminado');
                if (this.selectedCatalog?.id) {
                    this.catalogItems$ = this.catalogService.getItemsByCatalogId(this.selectedCatalog.id);
                }
            } catch (error) {
                this.toast.error('Error al eliminar');
            }
        }
    }

    async deleteCatalog(id: string) {
        const confirmed = await this.confirm.ask({
            title: '¿Eliminar catálogo?',
            message: 'Se eliminará el catálogo y todos sus ítems asociados de forma permanente.',
            type: 'danger',
            confirmText: 'Eliminar Todo'
        });

        if (confirmed) {
            try {
                await this.catalogService.deleteCatalog(id);
                this.toast.success('Catálogo eliminado completamente');
                this.selectedCatalog = null;
            } catch (error) {
                this.toast.error('Error al eliminar el catálogo');
            }
        }
    }

    async seedCatalogs() {
        const confirmed = await this.confirm.ask({
            title: 'Carga Inicial de Catálogos',
            message: 'Se cargarán los datos base de Tipos de Solicitud, Delitos, Unidades y Organismos extraídos del Excel. ¿Desea continuar?',
            confirmText: 'Iniciar Carga'
        });

        if (!confirmed) return;

        this.isSeeding = true;
        try {
            await this.createCatalogAndItems('Tipos de Solicitud', CATALOG_CODES.TIPOS_SOLICITUD, CATALOG_SEED_DATA.TIPOS_SOLICITUD);
            await this.createCatalogAndItems('Tipos de Delito', CATALOG_CODES.TIPOS_DELITO, CATALOG_SEED_DATA.TIPOS_DELITO);
            await this.createCatalogAndItems('Unidades', CATALOG_CODES.UNIDADES, CATALOG_SEED_DATA.UNIDADES_PRINCIPALES);
            await this.createCatalogAndItems('Organismos', CATALOG_CODES.ORGANISMOS, CATALOG_SEED_DATA.ORGANISMOS);

            this.toast.success('Carga masiva completada con éxito');
        } catch (error) {
            console.error('Error durante el seeding:', error);
            this.toast.error('Error durante la carga masiva');
        } finally {
            this.isSeeding = false;
        }
    }

    private async createCatalogAndItems(name: string, code: string, items: string[]) {
        const catalog: Catalog = {
            name: name,
            code: code,
            isActive: true,
            createdAt: Timestamp.now(),
            createdBy: 'system-seed'
        };

        const catalogRef = await this.catalogService.addCatalog(catalog);
        const catalogId = catalogRef.id;

        const promises = items.map((itemName, index) => {
            const item: CatalogItem = {
                catalogId: catalogId,
                name: itemName,
                order: index,
                isActive: true,
                createdAt: Timestamp.now(),
                createdBy: 'system-seed'
            };
            return this.catalogService.addItem(item);
        });

        await Promise.all(promises);
    }
}
