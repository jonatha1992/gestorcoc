import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EquipmentService } from '../../services/equipment';
import { Equipment } from '../../models/models';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './equipment-form.html',
  styleUrl: './equipment-form.css',
})
export class EquipmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  equipmentForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    category: ['', [Validators.required]],
    serialNumber: [''],
    brand: [''],
    model: [''],
    status: ['Disponible', [Validators.required]],
    description: [''],
  });

  isEditMode = false;
  equipmentId?: string;

  ngOnInit() {
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

    const equipmentData: Equipment = {
      ...this.equipmentForm.value,
      createdAt: this.isEditMode ? undefined : new Date()
    };

    try {
      if (this.isEditMode && this.equipmentId) {
        await this.equipmentService.updateEquipment({ ...equipmentData, id: this.equipmentId });
      } else {
        await this.equipmentService.addEquipment(equipmentData);
      }
      this.router.navigate(['/equipamiento']);
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert('Error al guardar el equipo');
    }
  }
}
