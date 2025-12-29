import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CameraService, UnitService, CctvSystemService, ToastService } from '../../services';
import { Camera, Unit, CctvSystem } from '../../models';

@Component({
    selector: 'app-camera-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './camera-list.html',
})
export class CameraListComponent implements OnInit {
    private cameraService = inject(CameraService);
    private unitService = inject(UnitService);
    private systemService = inject(CctvSystemService);

    cameras$: Observable<any[]> = combineLatest([
        this.cameraService.getCameras(),
        this.unitService.getUnits(),
        this.systemService.getSystems()
    ]).pipe(
        map(([cameras, units, systems]: [Camera[], Unit[], CctvSystem[]]) => {
            return cameras.map(cam => ({
                ...cam,
                unitName: units.find(u => u.id === cam.orgUnitId)?.name || '-',
                systemName: systems.find(s => s.id === cam.orgSystemId)?.name || '-'
            }));
        })
    );

    ngOnInit() { }

    deleteCamera(id: string | undefined) {
        if (id && confirm('¿Estás seguro de eliminar esta cámara?')) {
            this.cameraService.deleteCamera(id);
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Operativa': return 'bg-green-100 text-green-800';
            case 'Con Falla': return 'bg-red-100 text-red-800';
            case 'Fuera de Servicio': return 'bg-gray-100 text-gray-800';
            case 'Mantenimiento': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}
