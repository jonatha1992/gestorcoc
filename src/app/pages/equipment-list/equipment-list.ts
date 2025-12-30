import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EquipmentService, UnitService, ToastService } from '../../services';
import { Equipment, Unit } from '../../models';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './equipment-list.html',
})
export class EquipmentListComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private unitService = inject(UnitService);

  equipment$: Observable<any[]> = combineLatest([
    this.equipmentService.getEquipment(),
    this.unitService.getUnits()
  ]).pipe(
    map(([equipment, units]: [Equipment[], Unit[]]) => {
      return equipment.map(item => ({
        ...item,
        unitName: units.find(u => u.id === item.orgUnitId)?.name || '-'
      }));
    })
  );

  ngOnInit() { }

  deleteEquipment(id: string | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este equipo?')) {
      this.equipmentService.deleteEquipment(id);
    }
  }
}
