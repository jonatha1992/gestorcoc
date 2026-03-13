import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ChartComponent } from 'ng-apexcharts';

import { DashboardModuleResponse, DashboardService } from '../../services/dashboard.service';
import {
  getFirstDayOfCurrentMonthInputValue,
  getTodayDateInputValue,
} from '../../utils/date-inputs';
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
  @Input() labels: unknown;
  @Input() legend: unknown;
  @Input() stroke: unknown;
  @Input() fill: unknown;
  @Input() plotOptions: unknown;
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
      { key: 'COORDINADOR_COC', label: 'Coordinador COC', value: 2 },
      { key: 'OPERADOR', label: 'Operador', value: 1 },
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
  let dashboardServiceMock: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    dashboardServiceMock = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'getNovedades',
      'getHechos',
      'getRecords',
      'getPersonnel',
      'getMap',
    ]);
    dashboardServiceMock.getNovedades.and.returnValue(of(novedadesResponse));
    dashboardServiceMock.getHechos.and.returnValue(of(novedadesResponse as DashboardModuleResponse));
    dashboardServiceMock.getRecords.and.returnValue(of(recordsResponse));
    dashboardServiceMock.getPersonnel.and.returnValue(of(personnelResponse));
    dashboardServiceMock.getMap.and.returnValue(
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
            personnel_count: 5,
            cameras_online: 7,
            cameras_offline: 1,
            last_event_at: '2026-03-09T10:00:00Z',
          },
        ],
      }),
    );

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

  it('renders the active module as soon as it responds without waiting for the full batch', () => {
    const novedadesSubject = new Subject<DashboardModuleResponse>();
    const hechosSubject = new Subject<DashboardModuleResponse>();
    const recordsSubject = new Subject<DashboardModuleResponse>();
    const personnelSubject = new Subject<DashboardModuleResponse>();

    dashboardServiceMock.getNovedades.and.returnValue(novedadesSubject.asObservable());
    dashboardServiceMock.getHechos.and.returnValue(hechosSubject.asObservable());
    dashboardServiceMock.getRecords.and.returnValue(recordsSubject.asObservable());
    dashboardServiceMock.getPersonnel.and.returnValue(personnelSubject.asObservable());

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBeTrue();
    expect(fixture.componentInstance.cards()).toEqual([]);

    novedadesSubject.next(novedadesResponse);
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.cards()[0]?.value).toBe(8);
    expect(fixture.componentInstance.activeModuleData()?.module).toBe('novedades');
  });

  it('renders readable personnel labels instead of raw role codes', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectModule('Personal');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const dateInputs = fixture.nativeElement.querySelectorAll('input[type="date"]');

    expect(text).toContain('Coordinador COC');
    expect(text).toContain('Operador');
    expect(text).not.toContain('COORDINADOR_COC');
    expect(dateInputs.length).toBe(2);
  });

  it('shows from and to filters with novedades as the default module', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    let dateInputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
    expect(fixture.componentInstance.selectedModule()).toBe('Novedades');
    expect(dateInputs.length).toBe(2);

    fixture.componentInstance.selectModule('Registros');
    fixture.detectChanges();

    dateInputs = fixture.nativeElement.querySelectorAll('input[type="date"]');

    expect(dateInputs.length).toBe(2);
  });

  it('maps from and to to the real dashboard date filters', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    fixture.componentInstance.setFilterValue('from_date', '2026-02-01');
    fixture.componentInstance.setFilterValue('to_date', '2026-02-28');

    expect(fixture.componentInstance.getFilterValue('from_date')).toBe('2026-02-01');
    expect(fixture.componentInstance.getFilterValue('to_date')).toBe('2026-02-28');
    expect(fixture.componentInstance.getFilterValue('created_at__gte')).toBe('2026-02-01');
    expect(fixture.componentInstance.getFilterValue('created_at__lte')).toBe('2026-02-28');
    expect(fixture.componentInstance.getFilterValue('timestamp__gte')).toBe('2026-02-01');
    expect(fixture.componentInstance.getFilterValue('timestamp__lte')).toBe('2026-02-28');
    expect(fixture.componentInstance.getFilterValue('entry_date__gte')).toBe('2026-02-01');
    expect(fixture.componentInstance.getFilterValue('entry_date__lte')).toBe('2026-02-28');
  });

  it('renders the module selector and keeps the current chart types', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const moduleSelect = fixture.nativeElement.querySelector('select');
    const optionValues = Array.from(moduleSelect.querySelectorAll('option')).map(
      (option: HTMLOptionElement) => option.value,
    );

    expect(moduleSelect).toBeTruthy();
    expect(optionValues).toEqual(['Novedades', 'Registros', 'Hechos', 'Personal']);
    expect(fixture.componentInstance.trendChart().chart.type).toBe('area');
    expect(fixture.componentInstance.primaryPieChart().chart.type).toBe('donut');
    expect(fixture.componentInstance.statusChart().chart.type).toBe('bar');
  });

  it('reuses cached module data when changing tabs without changing filters', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(dashboardServiceMock.getNovedades).toHaveBeenCalledTimes(1);
    expect(dashboardServiceMock.getRecords).toHaveBeenCalledTimes(1);

    fixture.componentInstance.selectModule('Registros');
    fixture.detectChanges();

    expect(dashboardServiceMock.getNovedades).toHaveBeenCalledTimes(1);
    expect(dashboardServiceMock.getRecords).toHaveBeenCalledTimes(1);
  });

  it('uses the current month defaults and restores them when clearing filters', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const monthStart = getFirstDayOfCurrentMonthInputValue();
    const today = getTodayDateInputValue();

    expect(fixture.componentInstance.getFilterValue('from_date')).toBe(monthStart);
    expect(fixture.componentInstance.getFilterValue('to_date')).toBe(today);

    fixture.componentInstance.setFilterValue('from_date', '2026-02-03');
    fixture.componentInstance.setFilterValue('to_date', '2026-02-12');
    fixture.componentInstance.clearFilters();

    expect(fixture.componentInstance.getFilterValue('from_date')).toBe(monthStart);
    expect(fixture.componentInstance.getFilterValue('to_date')).toBe(today);
  });

  it('caps all dashboard date inputs at today', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const today = getTodayDateInputValue();
    const dateInputs = Array.from(
      fixture.nativeElement.querySelectorAll('input[type="date"]'),
    ) as HTMLInputElement[];

    expect(dateInputs.length).toBe(2);
    expect(dateInputs.every((input) => input.max === today)).toBeTrue();
  });

  it('shows CREV coverage by default and unit coverage when a point is selected', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.mapCoverageLabel()).toBe('Cobertura por CREV');

    fixture.componentInstance.selectPoint({
      unit_code: 'EZE',
      unit_name: 'Ezeiza',
      airport: 'Ministro Pistarini',
      lat: -34.8222,
      lon: -58.5358,
      novedades_count: 2,
      hechos_count: 1,
      records_count: 3,
      personnel_count: 5,
      cameras_online: 7,
      cameras_offline: 1,
      last_event_at: '2026-03-09T10:00:00Z',
    });

    expect(fixture.componentInstance.mapCoverageLabel()).toBe('Cobertura por unidad · EZE');
  });

  it('keeps CREV coverage after deselecting the current unit', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const point = fixture.componentInstance.mapPoints()[0];

    fixture.componentInstance.selectPoint(point);
    expect(fixture.componentInstance.selectedPoint()?.unit_code).toBe(point.unit_code);

    fixture.componentInstance.selectPoint(point);
    expect(fixture.componentInstance.selectedPoint()).toBeNull();
    expect(fixture.componentInstance.mapCoverageLabel()).toBe('Cobertura por CREV');
  });
});
