import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HechoService } from '../../services/hecho.service';
import { Hecho } from '../../models/hecho.model';
import { Observable, map } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-hecho-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './hecho-list.html'
})
export class HechoListComponent {
    private hechoService = inject(HechoService);
    hechos$ = this.hechoService.getHechos();

    // Derived stats observable for the dashboard
    stats$ = this.hechos$.pipe(
        map(hechos => {
            return {
                total: hechos.length,
                conCausa: hechos.filter(h => h.generoCausa).length,
                monitoreo: hechos.filter(h => h.quienDetecta === 'Centro Monitoreo').length,
                solucionados: hechos.filter(h => h.solucionadoCOC).length
            };
        })
    );

    formatTimestamp(ts: Timestamp | any): Date {
        if (ts instanceof Timestamp) return ts.toDate();
        if (ts?.seconds) return new Date(ts.seconds * 1000);
        return new Date();
    }

    exportToExcel() {
        this.hechos$.subscribe(hechos => {
            // Flatten and format data for Excel
            const dataToExport = hechos.map(h => ({
                'Nro Orden': h.nroOrden,
                'Fecha': this.formatTimestamp(h.fechaIntervencion).toLocaleString(),
                'Novedad': h.novedad,
                'Sector': h.sector,
                'Detector': h.quienDetecta,
                'Elementos': h.elementos,
                'Generó Causa': h.generoCausa ? 'SÍ' : 'NO',
                'Solucionado COC': h.solucionadoCOC ? 'SÍ' : 'NO',
                'Hora Resolución': h.hsResolucion,
                'Falencia': h.falencia,
                'Sugerencia': h.sugerencia,
                'Detalle Cierre': h.detalleCierre,
                'Observaciones': h.observaciones
            }));

            // Create worksheet
            const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

            // Create workbook and add the worksheet
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Hechos');

            // Save to file
            const fileName = `Hechos_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        });
    }
}
