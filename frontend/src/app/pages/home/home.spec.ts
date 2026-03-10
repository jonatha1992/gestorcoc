import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ChartComponent } from 'ng-apexcharts';

import { DashboardModuleResponse, DashboardService } from '../../services/dashboard.service';
import { HomeComponent } from './home';

@Component({
  selector: 'apx-chart',
  standalone: true,
  template: '',
})
class MockChartComponent {
  @Input() series: unknown;
  @Input() chart: unknown;
  @Input() colors: unknown;
  @Input() stroke: unknown;
  @Input() fill: unknown;
  @Input() dataLabels: unknown;
  @Input() markers: unknown;
  @Input() grid: unknown;
  @Input() xaxis: unknown;
  @Input() yaxis: unknown;
  @Input() tooltip: unknown;
  @Input() noData: unknown;
}

const novedadesResponse: DashboardModuleResponse = {
  module: 'novedades',
  cards: [{ id: 'total', label: 'Total Novedades', value: 8 }],
  series: {
    trend: [{ label: '2026-03-01', value: 8 }],
    distribution_primary: [{ key: 'OPEN', label: 'Abierta', value: 5 }],
    distribution_secondary: [{ key: 'HIGH', label: 'Alta', value: 3 }],
  },
  totals: { records: 8 },
  empty_state: { is_empty: false, message: '' },
};

const personnelResponse: DashboardModuleResponse = {
  module: 'personnel',
  cards: [{ id: 'total', label: 'Total Personal', value: 4 }],
  series: {
    trend: [{ label: '2026-03-01', value: 4 }],
    distribution_primary: [
      { key: 'OP_CONTROL', label: 'Operador de Camaras (Fijas/Domos/PTZ)', value: 2 },
      { key: 'OP_VIEWER', label: 'Solo Visualizacion', value: 1 },
    ],
    distribution_secondary: [{ key: 'active', label: 'Activos', value: 3 }],
  },
  totals: { records: 4 },
  empty_state: { is_empty: false, message: '' },
};

const recordsResponse: DashboardModuleResponse = {
  module: 'records',
  cards: [{ id: 'total', label: 'Total Registros', value: 6 }],
  series: {
    trend: [{ label: '2026-03-01', value: 6 }],
    distribution_primary: [{ key: 'FINALIZADO', label: 'Finalizado', value: 2 }],
    distribution_secondary: [{ key: 'verified', label: 'Verificados', value: 4 }],
  },
  totals: { records: 6 },
  empty_state: { is_empty: false, message: '' },
};

describe('HomeComponent', () => {
  let dashboardServiceMock: Pick<
    DashboardService,
    'getNovedades' | 'getHechos' | 'getRecords' | 'getPersonnel' | 'getMap'
  >;

  beforeEach(async () => {
    dashboardServiceMock = {
      getNovedades: () => of(novedadesResponse),
      getHechos: () => of(novedadesResponse as DashboardModuleResponse),
      getRecords: () => of(recordsResponse),
      getPersonnel: () => of(personnelResponse),
      getMap: () =>
        of({
          scope: 'ba',
          points: [
            {
              unit_code: 'EZE',
              unit_name: 'Ezeiza',
              airport: 'Ministro Pistarini',
              lat: -34.8222,
              lon: -58.5358,
              novedades_count: 2,
              hechos_count: 1,
              records_count: 3,
              cameras_online: 7,
              cameras_offline: 1,
              last_event_at: '2026-03-09T10:00:00Z',
            },
          ],
        }),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardServiceMock },
      ],
    })
      .overrideComponent(HomeComponent, {
        remove: { imports: [ChartComponent] },
        add: { imports: [MockChartComponent] },
      })
      .compileComponents();
  });

  it('renders readable personnel labels instead of raw role codes', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.componentInstance.onModuleChange('personnel');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const selectOptions = Array.from(fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(
      (option) => option.textContent?.trim(),
    );

    expect(text).toContain('Operador de camaras');
    expect(text).toContain('Solo visualizacion');
    expect(text).not.toContain('OP_CONTROL');
    expect(selectOptions).toContain('Operador basico');
    expect(selectOptions).toContain('Administrador');
  });

  it('shows Finalizado in the records filter options', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.componentInstance.onModuleChange('records');
    fixture.detectChanges();

    const selectOptions = Array.from(fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>).map(
      (option) => option.textContent?.trim(),
    );

    expect(selectOptions).toContain('Finalizado');
  });
});
