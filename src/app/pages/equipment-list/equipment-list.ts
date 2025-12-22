import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EquipmentService } from '../../services/equipment';
import { Equipment } from '../../models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './equipment-list.html',
})
export class EquipmentListComponent implements OnInit {
  private equipmentService = inject(EquipmentService);

  equipment$ = this.equipmentService.getEquipment();

  ngOnInit() { }

  deleteEquipment(id: string | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este equipo?')) {
      this.equipmentService.deleteEquipment(id);
    }
  }
}
