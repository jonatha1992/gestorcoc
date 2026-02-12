import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HechosService, Hecho } from '../../services/hechos'; // Adjusted import path
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-hechos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './hechos.html',
  providers: [HechosService, AssetService]
})
export class HechosComponent implements OnInit {
  private hechosService = inject(HechosService);
  private assetService = inject(AssetService);
  private toastService = inject(ToastService);

  hechos = signal<Hecho[]>([]);
  cameras = signal<any[]>([]);
  showForm = signal(false);

  currentHecho: Partial<Hecho> = {
    category: 'OPERATIVO',
    timestamp: new Date().toISOString().slice(0, 16) // Default to now
  };

  ngOnInit() {
    this.loadHechos();
    this.loadCameras();
  }

  loadHechos() {
    this.hechosService.getHechos().subscribe({
      next: (data) => this.hechos.set(data),
      error: (err) => console.error('Error loading hechos', err)
    });
  }

  loadCameras() {
    this.assetService.getCameras().subscribe({
      next: (data) => this.cameras.set(data),
      error: (err) => console.error('Error loading cameras', err)
    });
  }

  openForm() {
    this.currentHecho = {
      category: 'OPERATIVO',
      timestamp: new Date().toISOString().slice(0, 16),
      is_solved: false,
      coc_intervention: false,
      generated_cause: false
    };
    this.showForm.set(true);
  }

  editHecho(hecho: Hecho) {
    this.currentHecho = {
      ...hecho,
      timestamp: hecho.timestamp ? hecho.timestamp.slice(0, 16) : '',
      end_time: hecho.end_time ? hecho.end_time.slice(0, 16) : ''
    };
    this.showForm.set(true);
  }

  deleteHecho(id: number) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    this.hechosService.deleteHecho(id).subscribe({
      next: () => {
        this.toastService.show('Hecho eliminado', 'success');
        this.loadHechos();
      },
      error: (err) => this.toastService.show('Error al eliminar', 'error')
    });
  }

  closeForm() {
    this.showForm.set(false);
  }

  saveHecho() {
    // Ensure timestamp is ISO
    if (!this.currentHecho.timestamp) {
      this.toastService.show('La fecha es obligatoria', 'error');
      return;
    }

    const payload: Partial<Hecho> = {
      ...this.currentHecho,
      timestamp: new Date(this.currentHecho.timestamp).toISOString(),
      end_time: this.currentHecho.end_time ? new Date(this.currentHecho.end_time).toISOString() : undefined
    };

    const request = this.currentHecho.id
      ? this.hechosService.updateHecho(this.currentHecho.id, payload)
      : this.hechosService.createHecho(payload);

    request.subscribe({
      next: () => {
        this.toastService.show('Hecho guardado correctamente', 'success');
        this.closeForm();
        this.loadHechos();
      },
      error: (err) => {
        console.error(err);
        this.toastService.show('Error al guardar hecho', 'error');
      }
    });
  }
}
