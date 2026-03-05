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

  // ——— Hechos module ———
  hechosToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.hechos().filter((h) => h.timestamp?.slice(0, 10) === today).length;
  });
  hechosUnsolved = computed(() => this.hechos().filter((h) => !h.is_solved).length);
  recentHechos = computed(() => [...this.hechos()].reverse().slice(0, 6));

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

  // ——— Personal module ———
  personnelInactive = computed(() => this.people().filter((p) => !p.is_active).length);
  recentActivePeople = computed(() => this.people().filter((p) => p.is_active).slice(0, 8));

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
