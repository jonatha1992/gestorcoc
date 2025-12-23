import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FilmRecordService } from '../../services/film-record';
import { CatalogService } from '../../services/catalog.service';
import { FilmRecord, CATALOG_CODES } from '../../models';
import * as XLSX from 'xlsx';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-film-record-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './film-record-list.html',
})
export class FilmRecordListComponent implements OnInit {
  private recordService = inject(FilmRecordService);
  private catalogService = inject(CatalogService);

  records: FilmRecord[] = [];
  loading = false;

  // Paginación
  pageSize = 20;
  lastVisible: any = null;
  history: any[] = [];

  // Filtros
  filters = {
    nroAsunto: '',
    estado: '',
    solicitante: ''
  };

  // Ordenamiento
  sortField = 'nroOrden';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Catálogos
  requestTypeMap: { [key: string]: string } = {};

  // Detalle Modal
  selectedRecord: FilmRecord | null = null;

  ngOnInit() {
    this.loadCatalogs();
    this.loadRecords();
  }

  loadCatalogs() {
    this.catalogService.getItemsByCatalogCode(CATALOG_CODES.TIPOS_SOLICITUD)
      .subscribe(items => {
        items.forEach(item => {
          if (item.id) this.requestTypeMap[item.id] = item.name;
        });
      });
  }

  loadRecords(reset = false) {
    if (reset) {
      this.lastVisible = null;
      this.history = [];
    }
    this.loading = true;
    this.recordService.getFilmRecords(
      this.pageSize,
      this.lastVisible,
      this.filters,
      this.sortField,
      this.sortDirection
    ).subscribe({
      next: (res) => {
        this.records = res.data;
        this.lastVisible = res.lastVisible;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading records', err);
        this.loading = false;
      }
    });
  }

  getRequestTypeName(id: string | undefined): string {
    if (!id) return '-';
    return this.requestTypeMap[id] || 'Otro';
  }

  openDetail(record: FilmRecord) {
    this.selectedRecord = record;
  }

  closeDetail() {
    this.selectedRecord = null;
  }

  nextPage() {
    if (this.lastVisible) {
      this.history.push(this.lastVisible);
      this.loadRecords();
    }
  }

  prevPage() {
    if (this.history.length > 0) {
      this.history.pop(); // Remove current
      const prev = this.history.length > 0 ? this.history[this.history.length - 1] : null;
      this.lastVisible = prev;
      this.history = []; // Reset for simplicity
      this.lastVisible = null;
      this.loadRecords();
    }
  }

  applyFilters() {
    this.loadRecords(true);
  }

  toggleSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.loadRecords(true);
  }

  deleteRecord(id: string | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este registro?')) {
      this.recordService.deleteFilmRecord(id).then(() => {
        this.loadRecords(true);
      });
    }
  }

  exportToExcel() {
    this.recordService.getAllFilmRecords().subscribe(allRecords => {
      const worksheet = XLSX.utils.json_to_sheet(allRecords);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
      XLSX.writeFile(workbook, 'Registros_Filmicos.xlsx');
    });
  }
}
