import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type TargetType = 'SYSTEM' | 'SERVER' | 'CAMERA' | 'GEAR';

@Component({
  selector: 'app-novedad-asset-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-3">
      <!-- Tipo de Activo -->
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
          Tipo de Activo
        </label>
        <select 
          [(ngModel)]="localTargetType" 
          (ngModelChange)="onTargetTypeChange()"
          class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium text-sm">
          <option value="SYSTEM">Sistema / Sitio</option>
          <option value="SERVER">Servidor</option>
          <option value="CAMERA">Cámara</option>
          <option value="GEAR">Equipamiento (Prensa)</option>
        </select>
      </div>

      <!-- Activos Seleccionados -->
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
          Activos Afectados
        </label>
        @if (selectedAssets.length > 0) {
        <div class="flex flex-wrap gap-2 mb-2">
          @for (asset of selectedAssets; track asset.id) {
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
            {{ asset.name }}
            <button type="button" (click)="removeAsset(asset.id)"
              class="hover:bg-indigo-200 rounded-full p-0.5 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
          }
        </div>
        }

        <!-- Buscador de Activos -->
        <div class="relative">
          <input type="text" 
            [(ngModel)]="assetSearchText"
            (input)="filterAssets()" 
            (focus)="showDropdown = true"
            (blur)="onSearchBlur()"
            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium text-sm"
            placeholder="Buscar y agregar activos..." 
            autocomplete="off">
          
          @if (showDropdown && filteredAssets.length > 0) {
          <div class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            @for (asset of filteredAssets; track asset.id) {
            <button type="button" 
              (click)="addAsset(asset)" 
              [disabled]="isAssetSelected(asset.id)"
              class="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between">
              <div>
                <div class="font-semibold text-slate-700">{{ asset.name }}</div>
                @if (localTargetType === 'SERVER' && asset.system_name) {
                <div class="text-[10px] text-slate-400">{{ asset.system_name }}</div>
                }
                @if (localTargetType === 'GEAR' && asset.serial_number) {
                <div class="text-[10px] text-slate-400">{{ asset.serial_number }}</div>
                }
              </div>
              @if (isAssetSelected(asset.id)) {
              <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              }
            </button>
            }
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class NovedadAssetSelectorComponent {
  @Input() targetType: TargetType = 'CAMERA';
  @Input() selectedAssets: any[] = [];
  @Input() systems: any[] = [];
  @Input() servers: any[] = [];
  @Input() cameras: any[] = [];
  @Input() gear: any[] = [];

  @Output() targetTypeChange = new EventEmitter<TargetType>();
  @Output() selectedAssetsChange = new EventEmitter<any[]>();

  localTargetType: TargetType = this.targetType;
  assetSearchText = '';
  filteredAssets: any[] = [];
  showDropdown = false;

  onTargetTypeChange() {
    this.targetTypeChange.emit(this.localTargetType);
    this.assetSearchText = '';
    this.showDropdown = false;
    this.filterAssets();
  }

  filterAssets() {
    let source: any[] = [];
    if (this.localTargetType === 'SYSTEM') source = this.systems;
    else if (this.localTargetType === 'SERVER') source = this.servers;
    else if (this.localTargetType === 'CAMERA') source = this.cameras;
    else if (this.localTargetType === 'GEAR') source = this.gear;

    if (!this.assetSearchText) {
      this.filteredAssets = source.slice(0, 50);
    } else {
      const search = this.assetSearchText.toLowerCase();
      this.filteredAssets = source
        .filter(
          (item) =>
            item.name?.toLowerCase().includes(search) ||
            item.serial_number?.toLowerCase().includes(search) ||
            item.system_name?.toLowerCase().includes(search),
        )
        .slice(0, 50);
    }
  }

  addAsset(asset: any) {
    if (!this.isAssetSelected(asset.id)) {
      const newAssets = [...this.selectedAssets, asset];
      this.selectedAssetsChange.emit(newAssets);
      this.assetSearchText = '';
      this.showDropdown = false;
      this.filterAssets();
    }
  }

  removeAsset(assetId: number) {
    const newAssets = this.selectedAssets.filter((a) => a.id !== assetId);
    this.selectedAssetsChange.emit(newAssets);
  }

  isAssetSelected(assetId: number): boolean {
    return this.selectedAssets.some((a) => a.id === assetId);
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }
}
