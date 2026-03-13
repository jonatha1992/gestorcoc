import { Component, OnInit, ViewChild, ElementRef, inject, TemplateRef, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from 'ng-apexcharts';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../services/layout.service';

import { UiIconComponent, UiIconName } from '../../components/ui-icon.component';
import {
  DashboardCard,
  DashboardModule,
  DashboardModuleResponse,
  DashboardSeriesPoint,
  DashboardService,
} from '../../services/dashboard.service';
import {
  getFirstDayOfCurrentMonthInputValue,
  getTodayDateInputValue,
} from '../../utils/date-inputs';

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

const _monthStart = getFirstDayOfCurrentMonthInputValue();
const _today = getTodayDateInputValue();

const FILTER_DEFAULTS: Record<string, string> = {
  from_date: _monthStart,
  to_date: _today,
  created_at__gte: _monthStart,
  created_at__lte: _today,
  timestamp__gte: _monthStart,
  timestamp__lte: _today,
  entry_date__gte: _monthStart,
  entry_date__lte: _today,
};

const cloneFilters = (): Record<string, string> => ({
  ...FILTER_DEFAULTS,
});

const SHARED_DATE_FILTERS: DashboardFilterField[] = [
  { key: 'from_date', label: 'Desde', type: 'date', icon: 'calendar' },
  { key: 'to_date', label: 'Hasta', type: 'date', icon: 'calendar' },
];

const MODULE_CONFIG: Record<string, DashboardModuleUiConfig> = {
  general: {
    label: 'Vista General',
    title: 'Resumen operativo integral',
    subtitle: 'Consolidado de novedades, hechos, registros y personal activo.',
    icon: 'layers',
    tone: 'sky',
    chartColor: '#0ea5e9',
    primaryTitle: 'Distribucion por modulo',
    secondaryTitle: 'Resumen por estado',
    filters: [],
    shortLabels: {
      novedades: 'Novedades',
      hechos: 'Hechos',
      records: 'Registros',
      personnel: 'Personal',
    },
    seriesIcons: {
      novedades: 'alert',
      hechos: 'clipboard',
      records: 'archive',
      personnel: 'users',
    },
    seriesTones: {
      novedades: 'amber',
      hechos: 'sky',
      records: 'emerald',
      personnel: 'slate',
    },
    cardMeta: {
      total: { icon: 'layers', helper: 'Total consolidado de registros.', tone: 'sky' },
      novedades: { icon: 'alert', helper: 'Novedades en el periodo.', tone: 'amber' },
      hechos: { icon: 'clipboard', helper: 'Hechos registrados.', tone: 'sky' },
      records: { icon: 'archive', helper: 'Registros filmicos.', tone: 'emerald' },
    },
  },
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
      OPERADOR: 'Operador',
      COORDINADOR_COC: 'Coordinador COC',
      CREV: 'CREV',
      COORDINADOR_CREV: 'Coordinador CREV',
      active: 'Activos',
      inactive: 'Inactivos',
    },
    seriesIcons: {
      ADMIN: 'shield',
      OPERADOR: 'eye',
      COORDINADOR_COC: 'users',
      CREV: 'camera',
      COORDINADOR_CREV: 'badge',
      active: 'check-circle',
      inactive: 'clock',
    },
    seriesTones: {
      ADMIN: 'sky',
      OPERADOR: 'cyan',
      COORDINADOR_COC: 'amber',
      CREV: 'emerald',
      COORDINADOR_CREV: 'slate',
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
  imports: [CommonModule, FormsModule, ChartComponent, UiIconComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartRadar') chartRadar!: ChartComponent;
  @ViewChild('headerFilters') headerFilters!: TemplateRef<any>;
<<<<<<< HEAD

=======
  
>>>>>>> dev
  private layoutService = inject(LayoutService);

  // Filtros
  selectedPeriod = 'semana';
  selectedRegion = 'todas';
  private readonly dashboardService = inject(DashboardService);
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  private readonly shortDateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });
  private readonly moduleCacheKeys: Record<DashboardModule, string | null> = {
    novedades: null,
    hechos: null,
    records: null,
    personnel: null,
  };
  private readonly moduleRequestIds: Record<DashboardModule, number> = {
    novedades: 0,
    hechos: 0,
    records: 0,
    personnel: 0,
  };
  private mapRequestId = 0;

  @ViewChild('leafletMap') leafletMapRef!: ElementRef<HTMLDivElement>;
  private leafletMap: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;

  readonly todayDate = getTodayDateInputValue();
  moduleLoadingState = signal<Record<DashboardModule, boolean>>({
    novedades: false,
    hechos: false,
    records: false,
    personnel: false,
  });
  moduleErrorState = signal<Record<DashboardModule, boolean>>({
    novedades: false,
    hechos: false,
    records: false,
    personnel: false,
  });
  mapLoading = signal(false);
  novedadesData = signal<DashboardModuleResponse | null>(null);
  hechosData = signal<DashboardModuleResponse | null>(null);
  recordsData = signal<DashboardModuleResponse | null>(null);
  personnelData = signal<DashboardModuleResponse | null>(null);
  mapPoints = signal<DashboardMapPoint[]>([]);
  selectedPoint = signal<DashboardMapPoint | null>(null);
  lastUpdated = signal<Date | null>(null);
  expandedChart = signal<string | null>(null);
<<<<<<< HEAD

  modules = signal(['Novedades', 'Registros', 'Hechos', 'Personal']);
  selectedModule = signal('Novedades');
  globalFilters = signal<Record<string, string>>(cloneFilters());

  readonly filterFields = computed<DashboardFilterField[]>(() => SHARED_DATE_FILTERS);
  readonly activeModuleKey = computed<DashboardModule>(() => {
    const map: Record<string, string> = {
      'Novedades': 'novedades',
      'Registros': 'records',
      'Hechos': 'hechos',
      'Personal': 'personnel'
    };
    return (map[this.selectedModule()] || 'novedades') as DashboardModule;
  });
  readonly loading = computed(() => this.moduleLoadingState()[this.activeModuleKey()]);

  readonly activeModuleData = computed(() => {
    const key = this.activeModuleKey();
    if (key === 'hechos') return this.hechosData();
    if (key === 'records') return this.recordsData();
    if (key === 'personnel') return this.personnelData();
    return this.novedadesData();
  });

=======
  
  modules = signal(['Novedades', 'Registros', 'Hechos', 'Personal']);
  selectedModule = signal('Novedades');
  globalFilters = signal<Record<string, string>>(cloneFilters());

  readonly filterFields = computed<DashboardFilterField[]>(() => SHARED_DATE_FILTERS);
  readonly activeModuleKey = computed<DashboardModule>(() => {
    const map: Record<string, string> = {
      'Novedades': 'novedades',
      'Registros': 'records',
      'Hechos': 'hechos',
      'Personal': 'personnel'
    };
    return (map[this.selectedModule()] || 'novedades') as DashboardModule;
  });
  readonly loading = computed(() => this.moduleLoadingState()[this.activeModuleKey()]);

  readonly activeModuleData = computed(() => {
    const key = this.activeModuleKey();
    if (key === 'hechos') return this.hechosData();
    if (key === 'records') return this.recordsData();
    if (key === 'personnel') return this.personnelData();
    return this.novedadesData();
  });

>>>>>>> dev
  readonly moduleTotal = computed(() => this.activeModuleData()?.totals.records ?? 0);
  readonly pointCount = computed(() => this.mapPoints().length);
  readonly emptyState = computed(() => this.activeModuleData()?.empty_state ?? { is_empty: false, message: '' });

  readonly cards = computed<DashboardCardView[]>(() => {
    const key = this.activeModuleKey();
    const config = MODULE_CONFIG[key as keyof typeof MODULE_CONFIG] || MODULE_CONFIG['novedades'];
    return (this.activeModuleData()?.cards ?? []).map((card, index) => {
      const meta = config.cardMeta[card.id] ?? {
        icon: config.icon,
        helper: 'Indicador principal del modulo.',
        tone: FALLBACK_TONES[index % FALLBACK_TONES.length],
      };
      return { ...card, ...meta };
    });
  });

  readonly primaryRows = computed<DashboardSeriesView[]>(() =>
    this.decorateSeries(this.activeModuleData()?.series.distribution_primary ?? [], 'primary', this.activeModuleKey() as any),
  );

  readonly secondaryRows = computed<DashboardSeriesView[]>(() =>
    this.decorateSeries(this.activeModuleData()?.series.distribution_secondary ?? [], 'secondary', this.activeModuleKey() as any),
  );

  readonly primaryPieChart = computed(() => {
    const key = this.activeModuleKey();
    const rows = this.decorateSeries(this.activeModuleData()?.series.distribution_primary ?? [], 'primary', key as any);
    const config = MODULE_CONFIG[key as keyof typeof MODULE_CONFIG] || MODULE_CONFIG['novedades'];
    return this.buildDistributionChart(rows, config.primaryTitle);
  });

  readonly priorityChart = computed(() => {
    const rows = this.secondaryRows() || [];
    return {
      series: [{ name: 'Total', data: rows.map((row) => row.value) }],
      chart: {
        type: 'bar' as const,
        height: 180,
        toolbar: { show: false },
        fontFamily: 'system-ui, sans-serif',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '60%',
        },
      },
      colors: rows.map((row) => TONE_HEX[row.tone] || '#cbd5e1'),
      dataLabels: { enabled: false },
      xaxis: {
        categories: rows.map((row) => row.displayLabel),
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 },
        },
      },
      grid: { show: false },
      tooltip: { theme: 'light' },
    };
  });

  readonly statusChart = computed(() => {
    // Usa distribution_secondary del módulo activo como bar chart vertical
    const rows = this.secondaryRows() || [];
    const config = this.activeModuleConfig();
    return {
      series: [{ name: config.secondaryTitle, data: rows.map((row) => row.value) }],
      chart: {
        type: 'bar' as const,
        height: 250,
        toolbar: { show: false },
        fontFamily: 'system-ui, sans-serif',
      },
      colors: rows.map((row) => TONE_HEX[row.tone] || '#cbd5e1'),
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: '55%', distributed: true },
      },
      dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
      stroke: { width: 0 },
      xaxis: {
        categories: rows.map((row) => row.displayLabel),
        labels: { style: { colors: '#64748b', fontSize: '10px', fontWeight: 600 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { show: false },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
      },
      legend: { show: false },
      tooltip: { theme: 'light' },
      noData: {
        text: 'Sin datos para el periodo',
        style: { color: '#94a3b8', fontSize: '12px' },
      },
    };
  });

  readonly topUnitsRadarChart = computed(() => {
    const key = this.activeModuleKey();
<<<<<<< HEAD

=======
    
>>>>>>> dev
    // Función para obtener el valor de una unidad según módulo activo
    const getUnitValue = (p: DashboardMapPoint): number => {
      if (key === 'hechos') return p.hechos_count;
      if (key === 'records') return p.records_count;
      if (key === 'personnel') return p.personnel_count;
      return p.novedades_count;
    };
<<<<<<< HEAD

=======
    
>>>>>>> dev
    // Top 5 units based on active module count
    const points = [...this.mapPoints()]
      .sort((a, b) => getUnitValue(b) - getUnitValue(a))
      .slice(0, 5);
<<<<<<< HEAD

=======
      
>>>>>>> dev
    const categories = points.length >= 3 ? points.map(p => p.unit_name.substring(0, 12)) : [];
    const data = points.length >= 3 ? points.map(p => getUnitValue(p)) : [];
    const hasData = data.length >= 3;

    return {
      series: [
        { name: this.selectedModule(), data: data },
      ],
      chart: {
        type: 'radar' as const,
        height: 250,
        toolbar: { show: false },
        fontFamily: 'system-ui, sans-serif',
      },
      labels: categories,
      colors: [TONE_HEX[this.activeModuleConfig().tone as ToneKey] || '#14b8a6'],
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      markers: { size: 3, hover: { size: 5 } },
      yaxis: { show: false },
      legend: {
        position: 'bottom' as const,
        horizontalAlign: 'center' as const,
        itemMargin: { horizontal: 8, vertical: 0 },
        fontSize: '11px',
        fontWeight: 500,
        labels: { colors: '#64748b' },
      },
      tooltip: { theme: 'light' },
      noData: {
        text: hasData ? '' : 'Se necesitan al menos 3 unidades',
        style: { color: '#94a3b8', fontSize: '12px' },
      },
    };
  });

  readonly activeModuleConfig = computed((): DashboardModuleUiConfig => {
    const key = this.activeModuleKey();
    return MODULE_CONFIG[key] || MODULE_CONFIG['novedades'];
  });

  readonly activeModuleStat = computed<PointDetailStat | null>(() => {
    const point = this.selectedPoint();
    if (!point) return null;
    const config = this.activeModuleConfig();
    const key = this.activeModuleKey();
    const value = key === 'hechos' ? point.hechos_count
      : key === 'records' ? point.records_count
<<<<<<< HEAD
        : key === 'personnel' ? point.personnel_count
          : point.novedades_count;
=======
      : key === 'personnel' ? point.personnel_count
      : point.novedades_count;
>>>>>>> dev
    return { label: config.label, value, icon: config.icon, tone: config.tone };
  });

  readonly selectedPointStats = computed<PointDetailStat[]>(() => {
    const point = this.selectedPoint();
    if (!point) return [];
    return [
      { label: 'Hechos', value: point.hechos_count, icon: 'clipboard', tone: 'sky' },
      { label: 'Registros', value: point.records_count, icon: 'archive', tone: 'emerald' },
      { label: 'Personal', value: point.personnel_count, icon: 'users', tone: 'slate' },
      { label: 'Camaras activas', value: point.cameras_online, icon: 'camera', tone: 'emerald' },
      { label: 'Camaras inactivas', value: point.cameras_offline, icon: 'warning', tone: 'rose' },
    ];
  });

  readonly mapCoverageLabel = computed(() => {
    const point = this.selectedPoint();
    if (!point) return 'Cobertura por CREV';
    return `Cobertura por unidad · ${point.unit_code}`;
  });

  readonly trendChart = computed(() => {
    const config = this.activeModuleConfig();
    const points = this.activeModuleData()?.series.trend ?? [];
    const categories = points.map((point) => this.formatTrendLabel(point.label));
    const values = points.map((point) => point.value);
<<<<<<< HEAD

=======
    
>>>>>>> dev
    // Etiqueta dinámica según módulo
    const seriesLabel = this.selectedModule();

    return {
      series: [
        { name: seriesLabel, data: values },
      ],
      chart: {
        type: 'area' as const,
        height: 250,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'system-ui, sans-serif',
        animations: { enabled: true, speed: 350 },
      },
      colors: [config.chartColor],
      stroke: { curve: 'smooth' as const, width: 2.5 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] },
      },
      markers: { size: 3, strokeWidth: 2, hover: { size: 5 } },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        padding: { left: 10, right: 10 },
      },
      xaxis: {
        categories: categories.length ? categories : [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 600 },
          rotate: -45,
          rotateAlways: categories.length > 15,
        },
      },
      yaxis: {
        show: true,
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
        },
      },
      legend: { show: false },
      tooltip: {
        theme: 'light',
        x: { show: true },
      },
      noData: {
        text: 'Sin datos de tendencia para el periodo',
        style: { color: '#94a3b8', fontSize: '12px' },
      },
    };
  });

  ngOnInit() {
    this.loadAllModules(this.currentFilters());
  }

  ngAfterViewInit() {
    this.layoutService.setHeaderContent(this.headerFilters);
    this.loadMap(this.currentFilters());
  }

  ngOnDestroy(): void {
    this.layoutService.clearHeaderContent();
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

  refresh() {
    const filters = this.currentFilters();
    this.loadAllModules(filters);
    this.loadMap(filters);
  }

  applyFilters() {
    this.refresh();
  }

  clearFilters() {
    this.globalFilters.set(cloneFilters());
    this.refresh();
  }

  onModuleChange(module: string) {
    this.selectModule(module);
  }

  selectModule(module: string) {
    this.selectedModule.set(module);
    const moduleKey = this.activeModuleKey();
    const filters = this.currentFilters();
    if (!this.moduleLoadingState()[moduleKey] && !this.isModuleCacheValid(moduleKey, filters)) {
      this.fetchModule(moduleKey, filters);
    }
  }

  selectPoint(point: DashboardMapPoint) {
    // Toggle: deseleccionar si se toca la misma unidad
    const current = this.selectedPoint();
    if (current && current.unit_code === point.unit_code) {
      this.selectedPoint.set(null);
    } else {
      this.selectedPoint.set(point);
    }
    this.refresh();
  }

  toggleExpand(chartId: string | null) {
    this.expandedChart.set(chartId);
  }



  toneClasses(tone: ToneKey) {
    const config: Record<ToneKey, any> = {
      sky: {
        badge: 'border-sky-200 bg-sky-50 text-sky-700',
        chip: 'bg-sky-100 text-sky-700',
        icon: 'bg-sky-100 text-sky-700 ring-sky-100',
        rail: 'bg-sky-100',
        bar: 'bg-sky-500',
        marker: 'bg-sky-500',
        border: 'border-b-sky-500',
      },
      amber: {
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        chip: 'bg-amber-100 text-amber-800',
        icon: 'bg-amber-100 text-amber-700 ring-amber-100',
        rail: 'bg-amber-100',
        bar: 'bg-amber-500',
        marker: 'bg-amber-500',
        border: 'border-b-amber-500',
      },
      emerald: {
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        chip: 'bg-emerald-100 text-emerald-800',
        icon: 'bg-emerald-100 text-emerald-700 ring-emerald-100',
        rail: 'bg-emerald-100',
        bar: 'bg-emerald-500',
        marker: 'bg-emerald-500',
        border: 'border-b-emerald-500',
      },
      rose: {
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
        chip: 'bg-rose-100 text-rose-800',
        icon: 'bg-rose-100 text-rose-700 ring-rose-100',
        rail: 'bg-rose-100',
        bar: 'bg-rose-500',
        marker: 'bg-rose-500',
        border: 'border-b-rose-500',
      },
      cyan: {
        badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
        chip: 'bg-cyan-100 text-cyan-800',
        icon: 'bg-cyan-100 text-cyan-700 ring-cyan-100',
        rail: 'bg-cyan-100',
        bar: 'bg-cyan-500',
        marker: 'bg-cyan-500',
        border: 'border-b-cyan-500',
      },
      slate: {
        badge: 'border-slate-200 bg-slate-100 text-slate-700',
        chip: 'bg-slate-200 text-slate-700',
        icon: 'bg-slate-100 text-slate-700 ring-slate-200',
        rail: 'bg-slate-200',
        bar: 'bg-slate-600',
        marker: 'bg-slate-700',
        border: 'border-b-slate-500',
      },
    };
    return config[tone] || config.slate;
  }

  getFilterValue(key: string): string {
    return this.globalFilters()[key] ?? '';
  }

  setFilterValue(key: string, value: string) {
    const filters = { ...this.globalFilters() };
    if (key === 'from_date') {
      filters['from_date'] = value;
      filters['created_at__gte'] = value;
      filters['timestamp__gte'] = value;
      filters['entry_date__gte'] = value;
    } else if (key === 'to_date') {
      filters['to_date'] = value;
      filters['created_at__lte'] = value;
      filters['timestamp__lte'] = value;
      filters['entry_date__lte'] = value;
    } else {
      filters[key] = value;
    }
    this.globalFilters.set(filters);
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

  private decorateSeries(
    points: DashboardSeriesPoint[],
    section: 'primary' | 'secondary',
    moduleName: DashboardModule | 'general',
  ): DashboardSeriesView[] {
    const config = MODULE_CONFIG[moduleName] || MODULE_CONFIG['novedades'];
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
    const base = { ...this.globalFilters() };
    const point = this.selectedPoint();
    if (point) {
      base['unit_code'] = point.unit_code;
    }
    return base;
  }

  private loadAllModules(filters: Record<string, string>) {
    const modules: DashboardModule[] = ['novedades', 'hechos', 'records', 'personnel'];
    modules.forEach((moduleKey) => this.fetchModule(moduleKey, filters));
  }

  private fetchModule(moduleKey: DashboardModule, filters: Record<string, string>) {
    const requestId = this.moduleRequestIds[moduleKey] + 1;
    const filtersKey = this.serializeFilters(filters);
    this.moduleRequestIds[moduleKey] = requestId;
    this.updateModuleLoading(moduleKey, true);
    this.updateModuleError(moduleKey, false);

    this.getModuleRequest(moduleKey, filters).subscribe({
      next: (response) => {
        if (this.moduleRequestIds[moduleKey] !== requestId) {
          return;
        }
        this.setModuleData(moduleKey, response);
        this.moduleCacheKeys[moduleKey] = filtersKey;
        this.updateModuleLoading(moduleKey, false);
        this.lastUpdated.set(new Date());
      },
      error: () => {
        if (this.moduleRequestIds[moduleKey] !== requestId) {
          return;
        }
        this.setModuleData(moduleKey, null);
        this.moduleCacheKeys[moduleKey] = null;
        this.updateModuleError(moduleKey, true);
        this.updateModuleLoading(moduleKey, false);
      },
    });
  }

  /** Construye un DashboardModuleResponse agregado para VISTA GENERAL */
  private buildGeneralAggregate(): DashboardModuleResponse | null {
    const nov = this.novedadesData();
    const hec = this.hechosData();
    const rec = this.recordsData();
    const per = this.personnelData();
    if (!nov && !hec && !rec && !per) return null;

    const totalNov = nov?.totals.records ?? 0;
    const totalHec = hec?.totals.records ?? 0;
    const totalRec = rec?.totals.records ?? 0;
    const totalPer = per?.totals.records ?? 0;
    const grandTotal = totalNov + totalHec + totalRec + totalPer;

    // Cards: resumen por módulo
    const cards: DashboardCard[] = [
      { id: 'total', label: 'Total registros', value: grandTotal },
      { id: 'novedades', label: 'Novedades', value: totalNov },
      { id: 'hechos', label: 'Hechos', value: totalHec },
      { id: 'records', label: 'Registros', value: totalRec },
    ];

    // distribution_primary: totales por módulo (para donut/pie)
    const distributionPrimary: DashboardSeriesPoint[] = [
      { key: 'novedades', label: 'Novedades', value: totalNov },
      { key: 'hechos', label: 'Hechos', value: totalHec },
      { key: 'records', label: 'Registros', value: totalRec },
      { key: 'personnel', label: 'Personal', value: totalPer },
    ];

    // distribution_secondary: combinar primeras 2 entradas de cada módulo
    const distributionSecondary: DashboardSeriesPoint[] = [
      ...(nov?.series.distribution_secondary?.slice(0, 2) ?? []),
      ...(hec?.series.distribution_secondary?.slice(0, 2) ?? []),
      ...(rec?.series.distribution_secondary?.slice(0, 2) ?? []),
    ];

    // trend: sumar los valores de cada fecha agrupando por label
    const trendMap = new Map<string, number>();
    const allTrends = [
      ...(nov?.series.trend ?? []),
      ...(hec?.series.trend ?? []),
      ...(rec?.series.trend ?? []),
    ];
    for (const point of allTrends) {
      trendMap.set(point.label, (trendMap.get(point.label) ?? 0) + point.value);
    }
    const trend: DashboardSeriesPoint[] = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));

    return {
      module: 'novedades' as DashboardModule, // Tipo técnico, no afecta la UI
      cards,
      series: {
        trend,
        distribution_primary: distributionPrimary,
        distribution_secondary: distributionSecondary,
      },
      totals: { records: grandTotal },
      empty_state: {
        is_empty: grandTotal === 0,
        message: grandTotal === 0 ? 'Sin datos para el periodo seleccionado' : '',
      },
    };
  }

  private loadMap(filters: Record<string, string>) {
    // Para el mapa NO mandamos el filtro de unidad (queremos ver todas las unidades)
    const mapFilters = { ...filters };
    delete mapFilters['unit_code'];
    const requestId = this.mapRequestId + 1;
    this.mapRequestId = requestId;
    this.mapLoading.set(true);

    this.dashboardService.getMap('ba', mapFilters).subscribe({
      next: ({ points }) => {
        if (this.mapRequestId !== requestId) {
          return;
        }
        const current = this.selectedPoint();
        const nextPoints = points ?? [];
        this.mapPoints.set(nextPoints);
        if (!nextPoints.length) {
          this.selectedPoint.set(null);
          this.mapLoading.set(false);
          return;
        }
        const nextSelection = current
          ? nextPoints.find((point) => point.unit_code === current.unit_code) ?? null
          : null;
        this.selectedPoint.set(nextSelection);
        this.mapLoading.set(false);
        this.lastUpdated.set(new Date());
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
        if (this.mapRequestId !== requestId) {
          return;
        }
        this.mapPoints.set([]);
        this.selectedPoint.set(null);
        this.mapLoading.set(false);
      },
    });
  }

  private getModuleRequest(moduleKey: DashboardModule, filters: Record<string, string>) {
    if (moduleKey === 'hechos') {
      return this.dashboardService.getHechos(filters);
    }
    if (moduleKey === 'records') {
      return this.dashboardService.getRecords(filters);
    }
    if (moduleKey === 'personnel') {
      return this.dashboardService.getPersonnel(filters);
    }
    return this.dashboardService.getNovedades(filters);
  }

  private setModuleData(moduleKey: DashboardModule, value: DashboardModuleResponse | null) {
    if (moduleKey === 'hechos') {
      this.hechosData.set(value);
      return;
    }
    if (moduleKey === 'records') {
      this.recordsData.set(value);
      return;
    }
    if (moduleKey === 'personnel') {
      this.personnelData.set(value);
      return;
    }
    this.novedadesData.set(value);
  }

  private updateModuleLoading(moduleKey: DashboardModule, value: boolean) {
    this.moduleLoadingState.update((state) => ({ ...state, [moduleKey]: value }));
  }

  private updateModuleError(moduleKey: DashboardModule, value: boolean) {
    this.moduleErrorState.update((state) => ({ ...state, [moduleKey]: value }));
  }

  private isModuleCacheValid(moduleKey: DashboardModule, filters: Record<string, string>): boolean {
    const filtersKey = this.serializeFilters(filters);
    return this.moduleCacheKeys[moduleKey] === filtersKey && !this.moduleErrorState()[moduleKey];
  }

  private serializeFilters(filters: Record<string, string>): string {
    return Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }
}
