import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { AssetService } from '../../services/asset.service';
import { NovedadService } from '../../services/novedad.service';
import { PersonnelService } from '../../services/personnel.service';
import { RecordsService } from '../../services/records.service';
import { HechosService } from '../../services/hechos';

type Module = 'novedades' | 'hechos' | 'records' | 'personal';

interface DashboardChartItem {
  label: string;
  value: number;
  barClass: string;
  badgeClass: string;
}

interface DashboardTrendPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './home.html',
  providers: [AssetService, NovedadService, PersonnelService, RecordsService, HechosService],
})
export class HomeComponent implements OnInit {
  private assetService = inject(AssetService);
  private novedadService = inject(NovedadService);
  private personnelService = inject(PersonnelService);
  private recordsService = inject(RecordsService);
  private hechosService = inject(HechosService);

  // Raw data
  systems = signal<any[]>([]);
  servers = signal<any[]>([]);
  cameras = signal<any[]>([]);
  novedades = signal<any[]>([]);
  people = signal<any[]>([]);
  records = signal<any[]>([]);
  hechos = signal<any[]>([]);

  loadingAssets = signal(true);

  // Module selector
  selectedModule = signal<Module>('novedades');

  readonly modules: { value: Module; label: string }[] = [
    { value: 'novedades', label: 'Novedades' },
    { value: 'hechos', label: 'Hechos' },
    { value: 'records', label: 'Registros Fílmicos' },
    { value: 'personal', label: 'Personal' },
  ];

  // ——— Top-bar KPIs (always visible) ———
  camerasOnline = computed(() => this.cameras().filter((c) => c.status === 'ONLINE').length);
  camerasOffline = computed(() => this.cameras().filter((c) => c.status === 'OFFLINE').length);
  openNovedades = computed(() => this.novedades().filter((n) => n.status === 'OPEN').length);
  activePersonnel = computed(() => this.people().filter((p) => p.is_active).length);

  // ——— Novedades module ———
  novedadesCritical = computed(
    () =>
      this.novedades().filter(
        (n) => n.status === 'OPEN' && (n.severity === 'CRITICAL' || n.severity === 'HIGH'),
      ).length,
  );
  novedadesClosed = computed(() => this.novedades().filter((n) => n.status === 'CLOSED').length);
  novedadesTrend = computed<DashboardTrendPoint[]>(() =>
    this.buildMonthlyTrend(this.novedades(), 'created_at'),
  );
  novedadesSeverityChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Crítica',
      value: this.novedades().filter((n) => n.severity === 'CRITICAL').length,
      barClass: 'bg-rose-500',
      badgeClass: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'Alta',
      value: this.novedades().filter((n) => n.severity === 'HIGH').length,
      barClass: 'bg-red-400',
      badgeClass: 'bg-red-100 text-red-700',
    },
    {
      label: 'Media',
      value: this.novedades().filter((n) => n.severity === 'MEDIUM').length,
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Baja',
      value: this.novedades().filter((n) => n.severity === 'LOW').length,
      barClass: 'bg-indigo-500',
      badgeClass: 'bg-indigo-100 text-indigo-700',
    },
  ]);
  novedadesStatusChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Abiertas',
      value: this.novedades().filter((n) => n.status === 'OPEN').length,
      barClass: 'bg-blue-500',
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'En progreso',
      value: this.novedades().filter((n) => n.status === 'IN_PROGRESS').length,
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Cerradas',
      value: this.novedades().filter((n) => n.status === 'CLOSED').length,
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
  ]);

  // ——— Hechos module ———
  hechosToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.hechos().filter((h) => h.timestamp?.slice(0, 10) === today).length;
  });
  hechosUnsolved = computed(() => this.hechos().filter((h) => !h.is_solved).length);
  hechosTrend = computed<DashboardTrendPoint[]>(() =>
    this.buildMonthlyTrend(this.hechos(), 'timestamp'),
  );
  hechosCategoryChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Operativo',
      value: this.hechos().filter((h) => h.category === 'OPERATIVO').length,
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Policial',
      value: this.hechos().filter((h) => h.category === 'POLICIAL').length,
      barClass: 'bg-blue-500',
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Informativo',
      value: this.hechos().filter((h) => h.category === 'INFORMATIVO').length,
      barClass: 'bg-slate-500',
      badgeClass: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Relevamiento',
      value: this.hechos().filter((h) => h.category === 'RELEVAMIENTO').length,
      barClass: 'bg-violet-500',
      badgeClass: 'bg-violet-100 text-violet-700',
    },
  ]);
  hechosResolutionChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Resueltos',
      value: this.hechos().filter((h) => !!h.is_solved).length,
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Pendientes',
      value: this.hechos().filter((h) => !h.is_solved).length,
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
    },
  ]);

  // ——— Records module ———
  recordsToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.records().filter((r) => r.created_at?.slice(0, 10) === today).length;
  });
  recordsThisMonth = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    return this.records().filter((r) => r.created_at?.slice(0, 7) === month).length;
  });
  recordsTrend = computed<DashboardTrendPoint[]>(() =>
    this.buildMonthlyTrend(this.records(), 'created_at'),
  );
  recordsDeliveryChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Pendiente',
      value: this.records().filter((r) => (r.delivery_status || 'PENDIENTE') === 'PENDIENTE').length,
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Entregado',
      value: this.records().filter((r) => r.delivery_status === 'ENTREGADO').length,
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Derivado',
      value: this.records().filter((r) => r.delivery_status === 'DERIVADO').length,
      barClass: 'bg-sky-500',
      badgeClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Finalizado',
      value: this.records().filter((r) => r.delivery_status === 'FINALIZADO').length,
      barClass: 'bg-indigo-500',
      badgeClass: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Anulado',
      value: this.records().filter((r) => r.delivery_status === 'ANULADO').length,
      barClass: 'bg-rose-500',
      badgeClass: 'bg-rose-100 text-rose-700',
    },
  ]);
  recordsIntegrityChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Verificado',
      value: this.records().filter((r) => this.isRecordIntegrityVerified(r)).length,
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Pendiente',
      value: this.records().filter((r) => !this.isRecordIntegrityVerified(r)).length,
      barClass: 'bg-slate-500',
      badgeClass: 'bg-slate-100 text-slate-700',
    },
  ]);

  // ——— Personal module ———
  personnelInactive = computed(() => this.people().filter((p) => !p.is_active).length);
  personnelTrend = computed<DashboardTrendPoint[]>(() =>
    this.buildMonthlyTrend(this.people(), 'created_at'),
  );
  personnelRoleChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Operador',
      value: this.people().filter((p) => p.role === 'OPERATOR').length,
      barClass: 'bg-indigo-500',
      badgeClass: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Fiscalizador',
      value: this.people().filter((p) => p.role === 'SUPERVISOR').length,
      barClass: 'bg-violet-500',
      badgeClass: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Admin',
      value: this.people().filter((p) => p.role === 'ADMIN').length,
      barClass: 'bg-sky-500',
      badgeClass: 'bg-sky-100 text-sky-700',
    },
  ]);
  personnelStatusChart = computed<DashboardChartItem[]>(() => [
    {
      label: 'Activos',
      value: this.people().filter((p) => !!p.is_active).length,
      barClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Inactivos',
      value: this.people().filter((p) => !p.is_active).length,
      barClass: 'bg-slate-500',
      badgeClass: 'bg-slate-100 text-slate-700',
    },
  ]);

  // Camera status per system
  getSystemOnlineCount(systemId: number): number {
    return this.cameras().filter((c) => c.system === systemId && c.status === 'ONLINE').length;
  }
  getSystemTotalCount(systemId: number): number {
    return this.cameras().filter((c) => c.system === systemId).length;
  }
  getSystemOnlinePercentage(systemId: number): number {
    const total = this.getSystemTotalCount(systemId);
    if (total === 0) return 0;
    return (this.getSystemOnlineCount(systemId) / total) * 100;
  }

  getChartMax(items: DashboardChartItem[]): number {
    const max = Math.max(...items.map((item) => item.value), 0);
    return max > 0 ? max : 1;
  }

  getChartWidth(value: number, max: number): number {
    if (!max || value <= 0) return 0;
    return (value / max) * 100;
  }

  getPaletteColor(index: number, palette: string[]): string {
    if (!palette.length) return '#94a3b8';
    return palette[index % palette.length];
  }

  getPieStyle(items: DashboardChartItem[], palette: string[]): string {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return 'conic-gradient(#e2e8f0 0 100%)';

    let accumulated = 0;
    const stops = items.map((item, index) => {
      const start = (accumulated / total) * 100;
      accumulated += item.value;
      const end = (accumulated / total) * 100;
      return `${this.getPaletteColor(index, palette)} ${start}% ${end}%`;
    });

    return `conic-gradient(${stops.join(',')})`;
  }

  getTrendPolyline(points: DashboardTrendPoint[]): string {
    if (!points.length) return '';
    const max = Math.max(...points.map((point) => point.value), 1);
    const step = points.length > 1 ? 100 / (points.length - 1) : 100;

    return points
      .map((point, index) => {
        const x = step * index;
        const y = 100 - (point.value / max) * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  private buildMonthlyTrend(rows: any[], dateField: string): DashboardTrendPoint[] {
    const now = new Date();
    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date
        .toLocaleString('es-AR', { month: 'short' })
        .replace('.', '')
        .toUpperCase();
      months.push({ key, label });
    }

    const counts = new Map(months.map((m) => [m.key, 0]));
    for (const row of rows) {
      const raw = row?.[dateField];
      if (!raw) continue;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    return months.map((m) => ({ label: m.label, value: counts.get(m.key) || 0 }));
  }

  // Chart options computed from dashboardStats
  monthlyChartOptions = computed(() => {
    const stats = this.dashboardStats();
    const categories = this._mergeCategories(
      stats?.monthly.records.map((r) => r.month) ?? [],
      stats?.monthly.hechos.map((r) => r.month) ?? [],
      stats?.monthly.novedades.map((r) => r.month) ?? [],
    ).map((d) => this._formatMonth(d));

    const allMonths = this._mergeCategories(
      stats?.monthly.records.map((r) => r.month) ?? [],
      stats?.monthly.hechos.map((r) => r.month) ?? [],
      stats?.monthly.novedades.map((r) => r.month) ?? [],
    );

    return {
      series: [
        {
          name: 'Registros',
          data: allMonths.map(
            (m) => stats?.monthly.records.find((r) => r.month.startsWith(m.slice(0, 7)))?.count ?? 0,
          ),
        },
        {
          name: 'Hechos',
          data: allMonths.map(
            (m) => stats?.monthly.hechos.find((r) => r.month.startsWith(m.slice(0, 7)))?.count ?? 0,
          ),
        },
        {
          name: 'Novedades',
          data: allMonths.map(
            (m) =>
              stats?.monthly.novedades.find((r) => r.month.startsWith(m.slice(0, 7)))?.count ?? 0,
          ),
        },
      ],
      chart: { type: 'bar' as const, height: 260, toolbar: { show: false } },
      colors: ['#6366f1', '#10b981', '#f43f5e'],
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories, labels: { style: { fontSize: '11px' } } },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      legend: { position: 'top' as const, fontSize: '12px' },
      grid: { borderColor: '#f1f5f9' },
    };
  });

  dailyChartOptions = computed(() => {
    const stats = this.dashboardStats();
    const allDays = this._mergeCategories(
      stats?.daily.records.map((r) => r.day) ?? [],
      stats?.daily.hechos.map((r) => r.day) ?? [],
      stats?.daily.novedades.map((r) => r.day) ?? [],
    );

    return {
      series: [
        {
          name: 'Registros',
          data: allDays.map(
            (d) => stats?.daily.records.find((r) => r.day === d)?.count ?? 0,
          ),
        },
        {
          name: 'Hechos',
          data: allDays.map(
            (d) => stats?.daily.hechos.find((r) => r.day === d)?.count ?? 0,
          ),
        },
        {
          name: 'Novedades',
          data: allDays.map(
            (d) => stats?.daily.novedades.find((r) => r.day === d)?.count ?? 0,
          ),
        },
      ],
      chart: { type: 'line' as const, height: 260, toolbar: { show: false } },
      colors: ['#6366f1', '#10b981', '#f43f5e'],
      stroke: { curve: 'smooth' as const, width: 2 },
      markers: { size: 3 },
      dataLabels: { enabled: false },
      xaxis: {
        categories: allDays.map((d) => this._formatDay(d)),
        labels: { rotate: -45, style: { fontSize: '10px' } },
      },
      yaxis: { labels: { style: { fontSize: '11px' } } },
      legend: { position: 'top' as const, fontSize: '12px' },
      grid: { borderColor: '#f1f5f9' },
    };
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loadingAssets.set(true);
    let systemsDone = false;
    let camerasDone = false;
    const checkDone = () => {
      if (systemsDone && camerasDone) this.loadingAssets.set(false);
    };

    this.assetService.getSystems().subscribe((data) => {
      this.systems.set((data as any)?.results ?? data);
      systemsDone = true;
      checkDone();
    });
    this.assetService.getServers().subscribe((data) => this.servers.set((data as any)?.results ?? data));
    this.assetService.getCameras().subscribe((data) => {
      this.cameras.set((data as any)?.results ?? data);
      camerasDone = true;
      checkDone();
    });
    this.novedadService.getNovedades().subscribe((data) => this.novedades.set((data as any)?.results ?? data));
    this.personnelService.getPeople().subscribe((data) => this.people.set((data as any)?.results ?? data));
    this.recordsService.getRecords().subscribe((data) => this.records.set((data as any)?.results ?? data));
    this.hechosService.getHechos().subscribe((data) => this.hechos.set((data as any)?.results ?? data));
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    };
    return map[severity] || severity;
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      POLICIAL: 'Policial',
      OPERATIVO: 'Operativo',
      INFORMATIVO: 'Informativo',
      RELEVAMIENTO: 'Relevamiento',
    };
    return map[cat] || cat;
  }

  private isRecordIntegrityVerified(record: any): boolean {
    return !!(
      record?.is_integrity_verified ||
      record?.is_verified ||
      record?.verified_by_crev ||
      record?.verification_date
    );
  }

  exportToExcel() {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.systems().map((s) => ({ ID: s.id, Nombre: s.name, Descripción: s.description ?? '' })),
      ),
      'Sistemas',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.servers().map((s) => ({
          ID: s.id,
          Nombre: s.name,
          'IP/Host': s.ip_address ?? '',
          Sistema: s.system,
        })),
      ),
      'Servidores',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.cameras().map((c) => ({ ID: c.id, Nombre: c.name, Estado: c.status, Sistema: c.system })),
      ),
      'Cámaras',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.novedades().map((n) => ({
          ID: n.id,
          Descripción: n.description,
          Severidad: n.severity,
          Estado: n.status,
          'Reportado por': n.reported_by,
        })),
      ),
      'Novedades',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.people().map((p) => ({
          ID: p.id,
          Apellido: p.last_name,
          Nombre: p.first_name,
          Activo: p.is_active ? 'Sí' : 'No',
        })),
      ),
      'Personal',
    );

    XLSX.writeFile(wb, `dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportToExcel() {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.systems().map((s) => ({ ID: s.id, Nombre: s.name, Descripción: s.description ?? '' })),
      ),
      'Sistemas',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.servers().map((s) => ({
          ID: s.id,
          Nombre: s.name,
          'IP/Host': s.ip_address ?? '',
          Sistema: s.system,
        })),
      ),
      'Servidores',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.cameras().map((c) => ({
          ID: c.id,
          Nombre: c.name,
          Estado: c.status,
          Sistema: c.system,
        })),
      ),
      'Cámaras',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.novedades().map((n) => ({
          ID: n.id,
          Descripción: n.description,
          Severidad: n.severity,
          Estado: n.status,
          'Reportado por': n.reported_by,
        })),
      ),
      'Novedades',
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        this.people().map((p) => ({
          ID: p.id,
          Apellido: p.last_name,
          Nombre: p.first_name,
          Activo: p.is_active ? 'Sí' : 'No',
        })),
      ),
      'Personal',
    );

    XLSX.writeFile(wb, `dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Private helpers
  private _mergeCategories(...arrays: string[][]): string[] {
    const set = new Set<string>();
    arrays.forEach((arr) => arr.forEach((v) => set.add(v)));
    return Array.from(set).sort();
  }

  private _formatMonth(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
  }

  private _formatDay(isoDate: string): string {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }
}
