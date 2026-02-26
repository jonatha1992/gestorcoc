import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { NovedadService } from '../../services/novedad.service';
import { PersonnelService } from '../../services/personnel.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './home.html',
  providers: [AssetService, NovedadService, PersonnelService]
})
export class HomeComponent implements OnInit {
  private assetService = inject(AssetService);
  private novedadService = inject(NovedadService);
  private personnelService = inject(PersonnelService);

  // Raw Signals
  systems = signal<any[]>([]);
  servers = signal<any[]>([]);
  cameras = signal<any[]>([]);
  novedades = signal<any[]>([]);
  people = signal<any[]>([]);

  // Filter Signal
  selectedCoc = signal<string>('ALL');

  // Computed Signals for Filtered Data
  filteredSystemsCount = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.systems().length;
    return this.systems().filter(s => s.id == this.selectedCoc()).length;
  });

  filteredServersCount = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.servers().length;
    return this.servers().filter(s => s.system == this.selectedCoc()).length;
  });

  filteredCamerasTotal = computed(() => {
    if (this.selectedCoc() === 'ALL') return this.cameras().length;
    return this.cameras().filter(c => c.system == this.selectedCoc()).length;
  });

  filteredCamerasOnline = computed(() => {
    const list = this.selectedCoc() === 'ALL'
      ? this.cameras()
      : this.cameras().filter(c => c.system == this.selectedCoc());
    return list.filter(c => c.status === 'ONLINE').length;
  });

  filteredCamerasOffline = computed(() => {
    const list = this.selectedCoc() === 'ALL'
      ? this.cameras()
      : this.cameras().filter(c => c.system == this.selectedCoc());
    return list.filter(c => c.status === 'OFFLINE').length;
  });

  stats = computed(() => ({
    openNovedades: this.novedades().filter((n: any) => n.status === 'OPEN').length,
    personnelActive: this.people().filter((p: any) => p.is_active).length,
    // Note: Novedades and Personnel are not filtered by COC/System yet as they might not be directly linked in the simple model, limiting scope to Cameras for now.
    // However, Novedad has 'camera' ID. We could filter that if we wanted.
  }));

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.assetService.getSystems().subscribe(data => this.systems.set(data));
    this.assetService.getServers().subscribe(data => this.servers.set(data));
    this.assetService.getCameras().subscribe(data => this.cameras.set(data));
    this.novedadService.getNovedades().subscribe(data => this.novedades.set(data));
    this.personnelService.getPeople().subscribe(data => this.people.set(data));
  }

  // Helpers for Chart
  getSystemOnlineCount(systemId: number): number {
    return this.cameras().filter(c => c.system === systemId && c.status === 'ONLINE').length;
  }

  getSystemTotalCount(systemId: number): number {
    return this.cameras().filter(c => c.system === systemId).length;
  }

  getSystemOnlinePercentage(systemId: number): number {
    const total = this.getSystemTotalCount(systemId);
    if (total === 0) return 0;
    return (this.getSystemOnlineCount(systemId) / total) * 100;
  }
}
