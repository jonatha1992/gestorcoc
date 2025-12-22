import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CameraService } from '../../services/camera.service';
import { CatalogService } from '../../services/catalog.service';
import { ToastService } from '../../services/toast.service';
import { LoaderComponent } from '../../components/ui/loader/loader';
import { Camera, CatalogItem, CATALOG_CODES } from '../../models';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
    selector: 'app-camera-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
    templateUrl: './camera-form.html',
})
export class CameraFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private cameraService = inject(CameraService);
    private catalogService = inject(CatalogService);
    private toast = inject(ToastService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    isLoading = false;

    // Catálogos
    locations$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.UBICACIONES);
    types$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.TIPOS_CAMARA);

    cameraForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        locationId: ['', [Validators.required]],
        typeId: [''],
        status: ['Operativa', [Validators.required]],
        ipAddress: [''],
        serialNumber: [''],
        brand: [''],
        model: [''],
        installationDate: [''],
        notes: [''],
    });

    statuses = [
        { value: 'Operativa', label: 'Operativa' },
        { value: 'Con Falla', label: 'Con Falla' },
        { value: 'Fuera de Servicio', label: 'Fuera de Servicio' },
        { value: 'Mantenimiento', label: 'Mantenimiento' },
    ];

    isEditMode = false;
    cameraId?: string;

    ngOnInit() {
        this.cameraId = this.route.snapshot.params['id'];
        if (this.cameraId) {
            this.isEditMode = true;
            this.cameraService.getCameraById(this.cameraId).subscribe(data => {
                if (data) {
                    this.cameraForm.patchValue(data);
                }
            });
        }
    }

    async onSubmit() {
        if (this.cameraForm.invalid) return;

        const formValue = this.cameraForm.value;

        const cameraData: Camera = {
            ...formValue,
            createdAt: this.isEditMode ? undefined : Timestamp.now(),
            createdBy: this.isEditMode ? undefined : 'system',
            updatedAt: this.isEditMode ? Timestamp.now() : undefined,
            updatedBy: this.isEditMode ? 'system' : undefined,
        };

        Object.keys(cameraData).forEach(key => {
            if (cameraData[key as keyof Camera] === undefined) {
                delete cameraData[key as keyof Camera];
            }
        });

        this.isLoading = true;
        try {
            if (this.isEditMode && this.cameraId) {
                await this.cameraService.updateCamera({ ...cameraData, id: this.cameraId });
                this.toast.success('Cámara actualizada correctamente');
            } else {
                await this.cameraService.addCamera(cameraData);
                this.toast.success('Nueva cámara registrada');
            }
            this.router.navigate(['/camaras']);
        } catch (error) {
            console.error('Error saving camera:', error);
            this.toast.error('Error al intentar guardar los datos de la cámara');
        } finally {
            this.isLoading = false;
        }
    }
}
