import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { ChartComponent } from 'ng-apexcharts';

import { UiIconComponent, UiIconName } from '../../components/ui-icon.component';
import {
  DashboardCard,
  DashboardModule,
  DashboardModuleResponse,
  DashboardSeriesPoint,
  DashboardService,
} from '../../services/dashboard.service';

type DashboardFilterType = 'text' | 'select' | 'date';
type ToneKey = 'sky' | 'amber' | 'emerald' | 'rose' | 'cyan' | 'slate';

interface DashboardFilterOption {
  value: string;
  label: string;
}

interface DashboardFilterField {
  key: string;
  label: string;
  type: DashboardFilterType;
  icon: UiIconName;
  placeholder?: string;
  options?: DashboardFilterOption[];
}

interface DashboardCardMeta {
  icon: UiIconName;
  helper: string;
  tone: ToneKey;
}

interface DashboardCardView extends DashboardCard, DashboardCardMeta { }

interface DashboardMapPoint {
  unit_code: string;
  unit_name: string;
  airport: string | null;
  lat: number;
  lon: number;
  novedades_count: number;
  hechos_count: number;
  records_count: number;
  personnel_count: number;
  cameras_online: number;
  cameras_offline: number;
  last_event_at: string | null;
}

interface DashboardSeriesView extends DashboardSeriesPoint {
  key: string;
  displayLabel: string;
  icon: UiIconName;
  tone: ToneKey;
  percent: number;
  trackKey: string;
}

interface PointDetailStat {
  label: string;
  value: number | string;
  icon: UiIconName;
  tone: ToneKey;
}

interface DashboardModuleUiConfig {
  label: string;
  title: string;
  subtitle: string;
  icon: UiIconName;
  tone: ToneKey;
  chartColor: string;
  primaryTitle: string;
  secondaryTitle: string;
  filters: DashboardFilterField[];
  shortLabels: Record<string, string>;
  seriesIcons: Record<string, UiIconName>;
  seriesTones: Record<string, ToneKey>;
  cardMeta: Record<string, DashboardCardMeta>;
}

const FALLBACK_TONES: ToneKey[] = ['sky', 'amber', 'emerald', 'rose', 'cyan', 'slate'];
const TONE_HEX: Record<ToneKey, string> = {
  sky: '#0ea5e9',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  slate: '#475569',
};

const _now = new Date();
const _yearStart = `${_now.getFullYear()}-01-01`;
const _today = _now.toISOString().split('T')[0];

const FILTER_DEFAULTS: Record<DashboardModule, Record<string, string>> = {
  novedades: {
    created_at__gte: _yearStart,
    created_at__lte: _today,
  },
  hechos: {
    timestamp__gte: _yearStart,
    timestamp__lte: _today,
  },
  records: {
    entry_date__gte: _yearStart,
    entry_date__lte: _today,
  },
  personnel: {},
};

const cloneFilters = (module: DashboardModule): Record<string, string> => ({
  ...FILTER_DEFAULTS[module],
});

const MODULE_CONFIG: Record<DashboardModule, DashboardModuleUiConfig> = {
  novedades: {
    label: 'Novedades',
    title: 'Panorama de novedades operativas',
    subtitle: 'Monitorea estados, severidad e incidentes reportados sobre CCTV y equipamiento.',
    icon: 'alert',
    tone: 'amber',
    chartColor: '#f97316',
    primaryTitle: 'Por estado',
    secondaryTitle: 'Por severidad',
    filters: [
      { key: 'created_at__gte', label: 'Desde', type: 'date', icon: 'calendar' },
      { key: 'created_at__lte', label: 'Hasta', type: 'date', icon: 'calendar' },
    ],
    shortLabels: {
      OPEN: 'Abierta',
      IN_PROGRESS: 'En progreso',
      CLOSED: 'Cerrada',
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Critica',
    },
    seriesIcons: {
      OPEN: 'clock',
      IN_PROGRESS: 'activity',
      CLOSED: 'check-circle',
      LOW: 'spark',
      MEDIUM: 'shield',
      HIGH: 'warning',
      CRITICAL: 'warning',
    },
    seriesTones: {
      OPEN: 'sky',
      IN_PROGRESS: 'amber',
      CLOSED: 'emerald',
      LOW: 'cyan',
      MEDIUM: 'sky',
      HIGH: 'amber',
      CRITICAL: 'rose',
    },
    cardMeta: {
      total: { icon: 'layers', helper: 'Registros visibles en el periodo.', tone: 'sky' },
      open: { icon: 'clock', helper: 'Pendientes de cierre o seguimiento.', tone: 'amber' },
      critical_high: { icon: 'warning', helper: 'Casos de mayor impacto operativo.', tone: 'rose' },
      closed: { icon: 'check-circle', helper: 'Novedades ya cerradas.', tone: 'emerald' },
    },
  },
  hechos: {
    label: 'Hechos',
    title: 'Bitacora operativa de hechos',
    subtitle: 'Visualiza actividad diaria, resolucion y categorias registradas en el centro de operaciones.',
    icon: 'clipboard',
    tone: 'sky',
    chartColor: '#2563eb',
    primaryTitle: 'Por categoria',
    secondaryTitle: 'Resolucion',
    filters: [
      { key: 'timestamp__gte', label: 'Desde', type: 'date', icon: 'calendar' },
      { key: 'timestamp__lte', label: 'Hasta', type: 'date', icon: 'calendar' },
    ],
    shortLabels: {
      POLICIAL: 'Policial',
      OPERATIVO: 'Operativo',
      INFORMATIVO: 'Informativo',
      RELEVAMIENTO: 'Relevamiento',
      resolved: 'Resueltos',
      pending: 'Pendientes',
    },
    seriesIcons: {
      POLICIAL: 'warning',
      OPERATIVO: 'bolt',
      INFORMATIVO: 'eye',
      RELEVAMIENTO: 'map',
      resolved: 'check-circle',
      pending: 'clock',
    },
    seriesTones: {
      POLICIAL: 'rose',
      OPERATIVO: 'sky',
      INFORMATIVO: 'cyan',
      RELEVAMIENTO: 'slate',
      resolved: 'emerald',
      pending: 'amber',
    },
    cardMeta: {
      total: { icon: 'layers', helper: 'Hechos visibles con los filtros actuales.', tone: 'sky' },
      today: { icon: 'bolt', helper: 'Actividad registrada hoy.', tone: 'cyan' },
      unsolved: { icon: 'warning', helper: 'Pendientes de resolucion.', tone: 'amber' },
      solved: { icon: 'check-circle', helper: 'Casos ya resueltos.', tone: 'emerald' },
    },
  },
  records: {
    label: 'Registros filmicos',
    title: 'Seguimiento de registros filmicos',
    subtitle: 'Controla entrega, verificacion e ingreso mensual de material resguardado.',
    icon: 'archive',
    tone: 'emerald',
    chartColor: '#0f766e',
    primaryTitle: 'Estado de entrega',
    secondaryTitle: 'Verificacion',
    filters: [
      { key: 'entry_date__gte', label: 'Desde', type: 'date', icon: 'calendar' },
      { key: 'entry_date__lte', label: 'Hasta', type: 'date', icon: 'calendar' },
    ],
    shortLabels: {
      PENDIENTE: 'Pendiente',
      ENTREGADO: 'Entregado',
      DERIVADO: 'Derivado',
      FINALIZADO: 'Finalizado',
      ANULADO: 'Anulado',
      verified: 'Verificados',
      unverified: 'No verificados',
    },
    seriesIcons: {
      PENDIENTE: 'clock',
      ENTREGADO: 'check-circle',
      DERIVADO: 'route',
      FINALIZADO: 'shield',
      ANULADO: 'warning',
      verified: 'shield',
      unverified: 'warning',
    },
    seriesTones: {
      PENDIENTE: 'amber',
      ENTREGADO: 'sky',
      DERIVADO: 'cyan',
      FINALIZADO: 'emerald',
      ANULADO: 'rose',
      verified: 'emerald',
      unverified: 'amber',
    },
    cardMeta: {
      total: { icon: 'layers', helper: 'Registros disponibles en la vista actual.', tone: 'sky' },
      verified: { icon: 'shield', helper: 'Integridad ya verificada.', tone: 'emerald' },
      pending: { icon: 'clock', helper: 'Pendientes de verificacion.', tone: 'amber' },
      month: { icon: 'calendar', helper: 'Ingresos del mes en curso.', tone: 'cyan' },
    },
  },
  personnel: {
    label: 'Personal',
    title: 'Estado del personal operativo',
    subtitle: 'Consulta roles, actividad y cobertura de guardias en una vista ejecutiva y legible.',
    icon: 'users',
    tone: 'slate',
    chartColor: '#334155',
    primaryTitle: 'Por rol',
    secondaryTitle: 'Actividad',
    filters: [],
    shortLabels: {
      ADMIN: 'Administrador',
      OP_EXTRACTION: 'Operador basico',
      OP_CONTROL: 'Operador de camaras',
      OP_VIEWER: 'Solo visualizacion',
      active: 'Activos',
      inactive: 'Inactivos',
    },
    seriesIcons: {
      ADMIN: 'shield',
      OP_EXTRACTION: 'eye',
      OP_CONTROL: 'camera',
      OP_VIEWER: 'badge',
      active: 'check-circle',
      inactive: 'clock',
    },
    seriesTones: {
      ADMIN: 'sky',
      OP_EXTRACTION: 'cyan',
      OP_CONTROL: 'amber',
      OP_VIEWER: 'slate',
      active: 'emerald',
      inactive: 'rose',
    },
    cardMeta: {
      total: { icon: 'layers', helper: 'Personal dentro de la vista actual.', tone: 'sky' },
      active: { icon: 'check-circle', helper: 'Dotacion activa en servicio.', tone: 'emerald' },
      inactive: { icon: 'clock', helper: 'Personal sin actividad actual.', tone: 'rose' },
    },
  },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChartComponent, UiIconComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  private readonly shortDateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  @ViewChild('leafletMap') leafletMapRef!: ElementRef<HTMLDivElement>;
  private leafletMap: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;

  selectedModule = signal<DashboardModule>('novedades');
  loading = signal(false);
  moduleData = signal<DashboardModuleResponse | null>(null);
  mapPoints = signal<DashboardMapPoint[]>([]);
  selectedPoint = signal<DashboardMapPoint | null>(null);
  lastUpdated = signal<Date | null>(null);

  private readonly filtersByModule: Record<DashboardModule, Record<string, string>> = {
    novedades: cloneFilters('novedades'),
    hechos: cloneFilters('hechos'),
    records: cloneFilters('records'),
    personnel: cloneFilters('personnel'),
  };

  readonly modules = (Object.entries(MODULE_CONFIG) as [DashboardModule, DashboardModuleUiConfig][])
    .map(([value, config]) => ({ value, label: config.label, icon: config.icon }));

  readonly activeModuleConfig = computed(() => MODULE_CONFIG[this.selectedModule()]);
  readonly filterFields = computed(() => this.activeModuleConfig().filters);
  readonly hasVisibleFilters = computed(() => this.filterFields().length > 0);
  readonly moduleTotal = computed(() => this.moduleData()?.totals.records ?? 0);
  readonly pointCount = computed(() => this.mapPoints().length);
  readonly emptyState = computed(() => this.moduleData()?.empty_state ?? { is_empty: false, message: '' });

  readonly cards = computed<DashboardCardView[]>(() => {
    const config = this.activeModuleConfig();
    return (this.moduleData()?.cards ?? []).map((card, index) => {
      const meta = config.cardMeta[card.id] ?? {
        icon: config.icon,
        helper: 'Indicador principal del modulo.',
        tone: FALLBACK_TONES[index % FALLBACK_TONES.length],
      };
      return { ...card, ...meta };
    });
  });

  readonly primaryRows = computed<DashboardSeriesView[]>(() =>
    this.decorateSeries(this.moduleData()?.series.distribution_primary ?? [], 'primary'),
  );

  readonly secondaryRows = computed<DashboardSeriesView[]>(() =>
    this.decorateSeries(this.moduleData()?.series.distribution_secondary ?? [], 'secondary'),
  );

  readonly primaryPieChart = computed(() =>
    this.buildDistributionChart(this.primaryRows(), this.activeModuleConfig().primaryTitle),
  );

  readonly secondaryPieChart = computed(() =>
    this.buildDistributionChart(this.secondaryRows(), this.activeModuleConfig().secondaryTitle),
  );

  readonly activeModuleStat = computed<PointDetailStat | null>(() => {
    const point = this.selectedPoint();
    if (!point) return null;
    switch (this.selectedModule()) {
      case 'novedades': return { label: 'Novedades', value: point.novedades_count, icon: 'alert', tone: 'amber' };
      case 'hechos': return { label: 'Hechos', value: point.hechos_count, icon: 'clipboard', tone: 'sky' };
      case 'records': return { label: 'Registros filmicos', value: point.records_count, icon: 'archive', tone: 'emerald' };
      case 'personnel': return { label: 'Personal activo', value: point.personnel_count, icon: 'users', tone: 'slate' };
      default: return { label: 'Camaras activas', value: point.cameras_online, icon: 'camera', tone: 'emerald' };
    }
  });

  readonly selectedPointStats = computed<PointDetailStat[]>(() => {
    const point = this.selectedPoint();
    if (!point) return [];
    const activeLabel = this.activeModuleStat()?.label;
    const all: PointDetailStat[] = [
      { label: 'Novedades', value: point.novedades_count, icon: 'alert', tone: 'amber' },
      { label: 'Hechos', value: point.hechos_count, icon: 'clipboard', tone: 'sky' },
      { label: 'Registros', value: point.records_count, icon: 'archive', tone: 'emerald' },
      { label: 'Personal', value: point.personnel_count, icon: 'users', tone: 'slate' },
      { label: 'Camaras activas', value: point.cameras_online, icon: 'camera', tone: 'emerald' },
      { label: 'Camaras inactivas', value: point.cameras_offline, icon: 'warning', tone: 'rose' },
    ];
    return activeLabel ? all.filter((s) => s.label !== activeLabel) : all;
  });

  readonly trendChart = computed(() => {
    const config = this.activeModuleConfig();
    const points = this.moduleData()?.series.trend ?? [];
    const categories = points.map((point) => this.formatTrendLabel(point.label));
    const values = points.map((point) => point.value);
    return {
      series: [{ name: config.label, data: values }],
      chart: {
        type: 'bar' as const,
        height: 312,
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: '#64748b',
        fontFamily: 'system-ui, sans-serif',
        animations: { enabled: true, speed: 350 },
      },
      colors: [config.chartColor],
      stroke: { curve: 'smooth' as const, width: 0 },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '52%',
        },
      },
      fill: {
        type: 'solid',
        opacity: 0.95,
      },
      dataLabels: { enabled: false },
      markers: { size: 0 },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { left: 4, right: 8 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: categories.map(() => '#94a3b8'),
            fontSize: '10px',
          },
        },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (value: number) => `${Math.round(value)}`,
          style: { colors: ['#94a3b8'] },
        },
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (value: number) => `${value} registros`,
        },
      },
      noData: {
        text: 'Sin datos para el periodo',
        style: {
          color: '#94a3b8',
          fontSize: '12px',
        },
      },
    };
  });

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    // Map init is deferred until loadMap resolves (DOM not ready yet at this point)
  }

  ngOnDestroy(): void {
    this.leafletMap?.remove();
    this.leafletMap = null;
  }

  private initLeafletMap(): void {
    if (!this.leafletMapRef?.nativeElement) return;
    if (this.leafletMap) return; // already initialized

    this.leafletMap = L.map(this.leafletMapRef.nativeElement, {
      center: [-34.62, -58.52],
      zoom: 10,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.leafletMap);

    this.markerLayer = L.layerGroup().addTo(this.leafletMap);

    const points = this.mapPoints();
    if (points.length) {
      this.updateLeafletMarkers(points);
    }
  }

  private makeAirportIcon(isSelected: boolean): L.DivIcon {
    const bg = isSelected ? '#f59e0b' : '#ffffff';
    const border = isSelected ? '#fbbf24' : '#38bdf8';
    const textColor = isSelected ? '#ffffff' : '#0f172a';
    const size = isSelected ? 36 : 30;
    return L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2px solid ${border};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:${isSelected ? 16 : 13}px;line-height:1;color:${textColor};">✈</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      tooltipAnchor: [0, -size],
    });
  }

  private updateLeafletMarkers(points: DashboardMapPoint[]): void {
    if (!this.leafletMap || !this.markerLayer) return;
    this.markerLayer.clearLayers();
    if (!points.length) return;

    const selected = this.selectedPoint();

    const latlngs: L.LatLngTuple[] = points.map((p) => [p.lat, p.lon]);
    L.polyline(latlngs, { color: '#38bdf8', weight: 2, opacity: 0.6, dashArray: '6 4' }).addTo(
      this.markerLayer,
    );

    points.forEach((point) => {
      const isSelected = selected?.unit_code === point.unit_code;
      const marker = L.marker([point.lat, point.lon], {
        icon: this.makeAirportIcon(isSelected),
      });
      marker.bindTooltip(
        `<strong>${point.unit_name}</strong><br><span style="color:#94a3b8">${point.unit_code} · ${point.airport ?? 'Sin aeropuerto'}</span>`,
        { direction: 'top', offset: [0, -4] },
      );
      marker.on('click', () => {
        this.selectPoint(point);
        this.updateLeafletMarkers(this.mapPoints());
      });
      this.markerLayer!.addLayer(marker);
    });

    const bounds = L.latLngBounds(latlngs);
    this.leafletMap.fitBounds(bounds, { padding: [50, 50] });
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
    const module = this.selectedModule();
    this.filtersByModule[module] = cloneFilters(module);
    this.refresh();
  }

  selectPoint(point: DashboardMapPoint) {
    this.selectedPoint.set(point);
  }

  modulePillClasses(moduleValue: string): Record<string, boolean> {
    const isActive = this.selectedModule() === moduleValue;
    const tone = MODULE_CONFIG[moduleValue as DashboardModule].tone;
    const tc = this.toneClasses(tone);
    return {
      'dashboard-module-pill-active': isActive,
      'dashboard-module-pill-idle': !isActive,
      [tc.badge]: isActive,
    };
  }

  moduleRoute() {
    const routeMap: Record<DashboardModule, string> = {
      novedades: '/novedades',
      hechos: '/hechos',
      records: '/records',
      personnel: '/personnel',
    };
    return routeMap[this.selectedModule()];
  }

  toneClasses(tone: ToneKey) {
    return {
      sky: {
        badge: 'border-sky-200 bg-sky-50 text-sky-700',
        chip: 'bg-sky-100 text-sky-700',
        icon: 'bg-sky-100 text-sky-700 ring-sky-100',
        rail: 'bg-sky-100',
        bar: 'bg-sky-500',
        marker: 'bg-sky-500',
      },
      amber: {
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        chip: 'bg-amber-100 text-amber-800',
        icon: 'bg-amber-100 text-amber-700 ring-amber-100',
        rail: 'bg-amber-100',
        bar: 'bg-amber-500',
        marker: 'bg-amber-500',
      },
      emerald: {
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        chip: 'bg-emerald-100 text-emerald-800',
        icon: 'bg-emerald-100 text-emerald-700 ring-emerald-100',
        rail: 'bg-emerald-100',
        bar: 'bg-emerald-500',
        marker: 'bg-emerald-500',
      },
      rose: {
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
        chip: 'bg-rose-100 text-rose-800',
        icon: 'bg-rose-100 text-rose-700 ring-rose-100',
        rail: 'bg-rose-100',
        bar: 'bg-rose-500',
        marker: 'bg-rose-500',
      },
      cyan: {
        badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
        chip: 'bg-cyan-100 text-cyan-800',
        icon: 'bg-cyan-100 text-cyan-700 ring-cyan-100',
        rail: 'bg-cyan-100',
        bar: 'bg-cyan-500',
        marker: 'bg-cyan-500',
      },
      slate: {
        badge: 'border-slate-200 bg-slate-100 text-slate-700',
        chip: 'bg-slate-200 text-slate-700',
        icon: 'bg-slate-100 text-slate-700 ring-slate-200',
        rail: 'bg-slate-200',
        bar: 'bg-slate-600',
        marker: 'bg-slate-700',
      },
    }[tone] || {
      badge: '', chip: '', icon: '', rail: '', bar: '', marker: ''
    };
  }

  getFilterValue(key: string): string {
    return this.filtersByModule[this.selectedModule()][key] ?? '';
  }

  setFilterValue(key: string, value: string) {
    this.filtersByModule[this.selectedModule()][key] = value;
    this.applyFilters();
  }

  formatPercent(value: number): string {
    if (value <= 0) return '0%';
    if (value < 1) return '<1%';
    return `${Math.round(value)}%`;
  }

  formatLastUpdated(): string {
    return this.formatDateTime(this.lastUpdated());
  }

  formatPointEvent(value: string | null): string {
    if (!value) return 'Sin actividad reciente';
    return this.formatDateTime(value);
  }

  currentDateRangeLabel(): string {
    const dateFields = this.filterFields().filter((field) => field.type === 'date');
    if (!dateFields.length) return 'Periodo actual';

    const from = dateFields[0] ? this.getFilterValue(dateFields[0].key) : '';
    const to = dateFields[1] ? this.getFilterValue(dateFields[1].key) : '';

    if (from && to) {
      return `${this.formatFilterDate(from)} al ${this.formatFilterDate(to)}`;
    }
    if (from) {
      return `Desde ${this.formatFilterDate(from)}`;
    }
    if (to) {
      return `Hasta ${this.formatFilterDate(to)}`;
    }
    return 'Periodo actual';
  }

  private decorateSeries(points: DashboardSeriesPoint[], section: 'primary' | 'secondary'): DashboardSeriesView[] {
    const config = this.activeModuleConfig();
    const total = points.reduce((acc, item) => acc + item.value, 0);
    return points.map((point, index) => {
      const key = point.key ?? point.label;
      return {
        ...point,
        key,
        displayLabel: config.shortLabels[key] ?? point.label,
        icon: config.seriesIcons[key] ?? (section === 'primary' ? config.icon : 'spark'),
        tone: config.seriesTones[key] ?? FALLBACK_TONES[index % FALLBACK_TONES.length],
        percent: total ? (point.value / total) * 100 : 0,
        trackKey: `${section}-${key}-${index}`,
      };
    });
  }

  private buildDistributionChart(rows: DashboardSeriesView[], title: string) {
    return {
      series: rows.map((row) => row.value),
      chart: {
        type: 'donut' as const,
        height: 250,
        toolbar: { show: false },
        fontFamily: 'system-ui, sans-serif',
      },
      labels: rows.map((row) => row.displayLabel),
      colors: rows.map((row) => TONE_HEX[row.tone]),
      legend: { show: false },
      stroke: {
        width: 2,
        colors: ['#ffffff'],
      },
      plotOptions: {
        pie: {
          donut: {
            size: '62%',
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: 18,
                color: '#64748b',
                fontSize: '11px',
              },
              value: {
                show: true,
                offsetY: -10,
                color: '#0f172a',
                fontSize: '24px',
                fontWeight: '700',
                formatter: (value: string) => `${value}`,
              },
              total: {
                show: true,
                label: title,
                color: '#94a3b8',
                formatter: () => `${rows.reduce((acc, row) => acc + row.value, 0)}`,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (value: number) => `${value} registros`,
        },
      },
      noData: {
        text: 'Sin datos para el periodo',
        style: {
          color: '#94a3b8',
          fontSize: '12px',
        },
      },
    };
  }

  private formatTrendLabel(value: string): string {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return this.shortDateFormatter.format(date);
  }

  private formatFilterDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return this.shortDateFormatter.format(date);
  }

  private formatDateTime(value: string | Date | null): string {
    if (!value) return 'Sin datos';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin datos';
    return this.dateTimeFormatter.format(date);
  }

  private currentFilters(): Record<string, string> {
    const base = { ...this.filtersByModule[this.selectedModule()] };
    const point = this.selectedPoint();
    if (point) {
      base['unit_code'] = point.unit_code;
    }
    return base;
  }

  private loadModule(filters: Record<string, string>) {
    const module = this.selectedModule();
    const onNext = (data: DashboardModuleResponse) => {
      this.moduleData.set(data);
      this.lastUpdated.set(new Date());
      this.loading.set(false);
    };
    const onError = () => {
      this.moduleData.set(null);
      this.loading.set(false);
    };

    if (module === 'novedades') {
      this.dashboardService.getNovedades(filters).subscribe({ next: onNext, error: onError });
      return;
    }
    if (module === 'hechos') {
      this.dashboardService.getHechos(filters).subscribe({ next: onNext, error: onError });
      return;
    }
    if (module === 'records') {
      this.dashboardService.getRecords(filters).subscribe({ next: onNext, error: onError });
      return;
    }
    this.dashboardService.getPersonnel(filters).subscribe({ next: onNext, error: onError });
  }

  private loadMap(filters: Record<string, string>) {
    // Para el mapa NO mandamos el filtro de unidad (queremos ver todas las unidades)
    const mapFilters = { ...filters };
    delete mapFilters['unit_code'];

    this.dashboardService.getMap('ba', mapFilters).subscribe({
      next: ({ points }) => {
        const current = this.selectedPoint();
        const nextPoints = points ?? [];
        this.mapPoints.set(nextPoints);
        if (!nextPoints.length) {
          this.selectedPoint.set(null);
          return;
        }
        const nextSelection = current
          ? nextPoints.find((point) => point.unit_code === current.unit_code) ?? nextPoints[0]
          : nextPoints[0];
        this.selectedPoint.set(nextSelection);
        setTimeout(() => {
          if (!this.leafletMap) {
            this.initLeafletMap();
          } else {
            this.updateLeafletMarkers(nextPoints);
            this.leafletMap.invalidateSize();
          }
        }, 50);
      },
      error: () => {
        this.mapPoints.set([]);
        this.selectedPoint.set(null);
      },
    });
  }
}
