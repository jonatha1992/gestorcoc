import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import { AssetService } from '../../services/asset.service';
import { NovedadService } from '../../services/novedad.service';
import { PersonnelService } from '../../services/personnel.service';
import { ApiService } from '../../services/api.service';

interface DashboardStats {
  monthly: {
    records: { month: string; count: number }[];
    hechos: { month: string; count: number }[];
    novedades: { month: string; count: number }[];
  };
  daily: {
    records: { day: string; count: number }[];
    hechos: { day: string; count: number }[];
    novedades: { day: string; count: number }[];
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './home.html',
  providers: [AssetService, NovedadService, PersonnelService],
})
export class HomeComponent implements OnInit {
  private assetService = inject(AssetService);
  private novedadService = inject(NovedadService);
  private personnelService = inject(PersonnelService);
  private apiService = inject(ApiService);

  // Raw Signals
  systems = signal<any[]>([]);
  servers = signal<any[]>([]);
  cameras = signal<any[]>([]);
  novedades = signal<any[]>([]);
  people = signal<any[]>([]);
  dashboardStats = signal<DashboardStats | null>(null);

  // Loading state — se pone false cuando systems Y cameras ambos llegaron
  loadingAssets = signal(true);

  // Filter Signal
  selectedCoc = signal<string>('ALL');

  // Computed Signals for Filtered Data
  filteredSystemsCount = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.systems().length;
    return this.systems().filter((s) => s.id == this.selectedCoc()).length;
  });

  filteredServersCount = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.servers().length;
    return this.servers().filter((s) => s.system == this.selectedCoc()).length;
  });

  filteredCamerasTotal = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.cameras().length;
    return this.cameras().filter((c) => c.system == this.selectedCoc()).length;
  });

  filteredCamerasOnline = computed(() => {
    const list =
      this.selectedCoc() === 'ALL'
        ? this.cameras()
        : this.cameras().filter((c) => c.system == this.selectedCoc());
    return list.filter((c) => c.status === 'ONLINE').length;
  });

  filteredCamerasOffline = computed(() => {
    const list =
      this.selectedCoc() === 'ALL'
        ? this.cameras()
        : this.cameras().filter((c) => c.system == this.selectedCoc());
    return list.filter((c) => c.status === 'OFFLINE').length;
  });

  stats = computed(() => ({
    openNovedades: this.novedades().filter((n: any) => n.status === 'OPEN').length,
    personnelActive: this.people().filter((p: any) => p.is_active).length,
  }));

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
    const checkDone = () => { if (systemsDone && camerasDone) this.loadingAssets.set(false); };

    this.assetService.getSystems().subscribe((data) => { this.systems.set(data); systemsDone = true; checkDone(); });
    this.assetService.getServers().subscribe((data) => this.servers.set(data));
    this.assetService.getCameras().subscribe((data) => { this.cameras.set(data); camerasDone = true; checkDone(); });
    this.novedadService.getNovedades().subscribe((data) => this.novedades.set(data));
    this.personnelService.getPeople().subscribe((data) => this.people.set(data));
    this.apiService
      .get<DashboardStats>('api/dashboard-stats/')
      .subscribe((data) => this.dashboardStats.set(data));
  }

  // Helpers for Camera Chart
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
