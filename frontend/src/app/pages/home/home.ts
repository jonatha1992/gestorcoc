import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DashboardMapPoint,
  DashboardModule,
  DashboardModuleResponse,
  DashboardSeriesPoint,
  DashboardService,
} from '../../services/dashboard.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  selectedModule = signal<DashboardModule>('novedades');
  loading = signal(false);
  moduleData = signal<DashboardModuleResponse | null>(null);
  mapPoints = signal<DashboardMapPoint[]>([]);
  selectedPoint = signal<DashboardMapPoint | null>(null);

  readonly modules = [
    { value: 'novedades', label: 'Novedades' },
    { value: 'hechos', label: 'Hechos' },
    { value: 'records', label: 'Registros Fílmicos' },
    { value: 'personnel', label: 'Personal' },
  ] as const;

  novedadesFilters: Record<string, string> = {
    search: '',
    status: '',
    severity: '',
    incident_type: '',
    created_at__gte: '',
    created_at__lte: '',
  };

  hechosFilters: Record<string, string> = {
    search: '',
    category: '',
    is_solved: '',
    timestamp__gte: '',
    timestamp__lte: '',
  };

  recordsFilters: Record<string, string> = {
    search: '',
    delivery_status: '',
    is_integrity_verified: '',
    has_backup: '',
    entry_date__gte: '',
    entry_date__lte: '',
  };

  personnelFilters: Record<string, string> = {
    search: '',
    role: '',
    is_active: '',
    unit__code: '',
    guard_group: '',
  };

  trend = computed<DashboardSeriesPoint[]>(() => this.moduleData()?.series.trend ?? []);
  primaryDist = computed<DashboardSeriesPoint[]>(() => this.moduleData()?.series.distribution_primary ?? []);
  secondaryDist = computed<DashboardSeriesPoint[]>(() => this.moduleData()?.series.distribution_secondary ?? []);
  cards = computed(() => this.moduleData()?.cards ?? []);
  emptyState = computed(() => this.moduleData()?.empty_state ?? { is_empty: false, message: '' });

  ngOnInit(): void {
    this.refresh();
  }

  onModuleChange(value: string) {
    this.selectedModule.set(value as DashboardModule);
    this.selectedPoint.set(null);
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    const filters = this.currentFilters();
    this.loadModule(filters);
    this.loadMap(filters);
  }

  applyFilters() {
    this.refresh();
  }

  clearFilters() {
    switch (this.selectedModule()) {
      case 'novedades':
        this.novedadesFilters = { search: '', status: '', severity: '', incident_type: '', created_at__gte: '', created_at__lte: '' };
        break;
      case 'hechos':
        this.hechosFilters = { search: '', category: '', is_solved: '', timestamp__gte: '', timestamp__lte: '' };
        break;
      case 'records':
        this.recordsFilters = { search: '', delivery_status: '', is_integrity_verified: '', has_backup: '', entry_date__gte: '', entry_date__lte: '' };
        break;
      case 'personnel':
        this.personnelFilters = { search: '', role: '', is_active: '', unit__code: '', guard_group: '' };
        break;
    }
    this.refresh();
  }

  selectPoint(point: DashboardMapPoint) {
    this.selectedPoint.set(point);
  }

  moduleRoute() {
    const map: Record<DashboardModule, string> = {
      novedades: '/novedades',
      hechos: '/hechos',
      records: '/records',
      personnel: '/personnel',
    };
    return map[this.selectedModule()];
  }

  getChartMax(points: DashboardSeriesPoint[]): number {
    const max = Math.max(...points.map((p) => p.value), 0);
    return max > 0 ? max : 1;
  }

  getChartWidth(value: number, max: number): number {
    return max <= 0 ? 0 : (value / max) * 100;
  }

  getTrendPolyline(points: DashboardSeriesPoint[]): string {
    if (!points.length) return '';
    const max = Math.max(...points.map((p) => p.value), 1);
    const step = points.length > 1 ? 100 / (points.length - 1) : 100;
    return points
      .map((p, idx) => {
        const x = step * idx;
        const y = 100 - (p.value / max) * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  mapLeft(point: DashboardMapPoint): number {
    const points = this.mapPoints();
    if (points.length <= 1) return 50;
    const minLon = Math.min(...points.map((p) => p.lon));
    const maxLon = Math.max(...points.map((p) => p.lon));
    if (maxLon === minLon) return 50;
    return ((point.lon - minLon) / (maxLon - minLon)) * 100;
  }

  mapTop(point: DashboardMapPoint): number {
    const points = this.mapPoints();
    if (points.length <= 1) return 50;
    const minLat = Math.min(...points.map((p) => p.lat));
    const maxLat = Math.max(...points.map((p) => p.lat));
    if (maxLat === minLat) return 50;
    return 100 - ((point.lat - minLat) / (maxLat - minLat)) * 100;
  }

  private currentFilters(): Record<string, string> {
    switch (this.selectedModule()) {
      case 'novedades':
        return this.novedadesFilters;
      case 'hechos':
        return this.hechosFilters;
      case 'records':
        return this.recordsFilters;
      case 'personnel':
      default:
        return this.personnelFilters;
    }
  }

  private loadModule(filters: Record<string, string>) {
    const module = this.selectedModule();
    const onNext = (data: DashboardModuleResponse) => {
      this.moduleData.set(data);
      this.loading.set(false);
    };
    const onError = () => {
      this.moduleData.set(null);
      this.loading.set(false);
    };
    if (module === 'novedades') {
      this.dashboardService.getNovedades(filters).subscribe({ next: onNext, error: onError });
    } else if (module === 'hechos') {
      this.dashboardService.getHechos(filters).subscribe({ next: onNext, error: onError });
    } else if (module === 'records') {
      this.dashboardService.getRecords(filters).subscribe({ next: onNext, error: onError });
    } else {
      this.dashboardService.getPersonnel(filters).subscribe({ next: onNext, error: onError });
    }
  }

  private loadMap(filters: Record<string, string>) {
    this.dashboardService.getMap('ba', filters).subscribe({
      next: ({ points }) => {
        this.mapPoints.set(points ?? []);
        if (!this.selectedPoint() && points.length > 0) {
          this.selectedPoint.set(points[0]);
        }
      },
      error: () => {
        this.mapPoints.set([]);
        this.selectedPoint.set(null);
      },
    });
  }
}
