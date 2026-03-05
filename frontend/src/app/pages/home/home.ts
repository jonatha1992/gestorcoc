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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
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
  recentOpenNovedades = computed(() => this.novedades().filter((n) => n.status === 'OPEN').slice(0, 6));
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
  recentHechos = computed(() => [...this.hechos()].reverse().slice(0, 6));
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
  recentRecords = computed(() => [...this.records()].reverse().slice(0, 6));
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
  recentActivePeople = computed(() => this.people().filter((p) => p.is_active).slice(0, 8));
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
}
