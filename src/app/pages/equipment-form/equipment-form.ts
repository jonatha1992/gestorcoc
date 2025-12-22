import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EquipmentService } from '../../services/equipment';
import { CatalogService } from '../../services/catalog.service';
import { ToastService } from '../../services/toast.service';
import { LoaderComponent } from '../../components/ui/loader/loader';
import { Equipment, CatalogItem, CATALOG_CODES } from '../../models';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './equipment-form.html',
})
export class EquipmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private equipmentService = inject(EquipmentService);
  private catalogService = inject(CatalogService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = false;

  // Catálogos para dropdowns
  categories$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.CATEGORIAS);
  locations$ = this.catalogService.getItemsByCatalogCode(CATALOG_CODES.UBICACIONES);

  equipmentForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    locationId: [''],
    serialNumber: [''],
    brand: [''],
    model: [''],
    status: ['Disponible', [Validators.required]],
    description: [''],
  });

  isEditMode = false;
  equipmentId?: string;

  // Estados hardcodeados (no vienen de catálogo)
  statuses = [
    { value: 'Disponible', label: 'Disponible' },
    { value: 'En Reparación', label: 'En Reparación' },
    { value: 'Entregado', label: 'Entregado' },
    { value: 'Baja', label: 'Baja' },
  ];

  ngOnInit() {
    // Modo edición
    this.equipmentId = this.route.snapshot.params['id'];
    if (this.equipmentId) {
      this.isEditMode = true;
      this.equipmentService.getEquipmentById(this.equipmentId).subscribe(data => {
        if (data) {
          this.equipmentForm.patchValue(data);
        }
      });
    }
  }

  async onSubmit() {
    if (this.equipmentForm.invalid) return;

    const formValue = this.equipmentForm.value;

    const equipmentData: Equipment = {
      ...formValue,
      createdAt: this.isEditMode ? undefined : Timestamp.now(),
      createdBy: this.isEditMode ? undefined : 'system', // TODO: usar AuthService.getCurrentUserId()
      updatedAt: this.isEditMode ? Timestamp.now() : undefined,
      updatedBy: this.isEditMode ? 'system' : undefined,
    };

    // Limpiar campos undefined
    Object.keys(equipmentData).forEach(key => {
      if (equipmentData[key as keyof Equipment] === undefined) {
        delete equipmentData[key as keyof Equipment];
      }
    });

    this.isLoading = true;
    try {
      if (this.isEditMode && this.equipmentId) {
        await this.equipmentService.updateEquipment({ ...equipmentData, id: this.equipmentId });
        this.toast.success('Equipo actualizado con éxito');
      } else {
        await this.equipmentService.addEquipment(equipmentData);
        this.toast.success('Nuevo equipo registrado');
      }
      this.router.navigate(['/equipamiento']);
    } catch (error) {
      console.error('Error saving equipment:', error);
      this.toast.error('Ocurrió un error al guardar los datos');
    } finally {
      this.isLoading = false;
    }
  }
}
