import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FilmRecordService } from '../../services/film-record';
import { CatalogService } from '../../services/catalog.service';
import { LoadingService } from '../../services/loading.service';
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
  private loadingService = inject(LoadingService);

  allRecords: FilmRecord[] = [];
  filteredRecords: FilmRecord[] = [];
  records: FilmRecord[] = []; // Current page
  loading = false;

  // Paginación
  pageSize = 20;
  currentPage = 1;
  totalPages = 1;

  // Filtros
  filters = {
    fechaDesde: '',
    fechaHasta: '',
    nroSolicitud: '',
    nroAsunto: '',
    estado: '',
    solicitante: '',
    idTipoSolicitud: '',
  };

  // Ordenamiento
  sortField = 'fechaIngreso';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Catálogos
  requestTypeMap: { [key: string]: string } = {};
  requestTypes: any[] = []; // List for dropdown

  // Detalle Modal
  selectedRecord: FilmRecord | null = null;

  ngOnInit() {
    this.setDefaultDates();
    this.loadCatalogs();
    this.loadAllRecords();
  }

  setDefaultDates() {
    const now = new Date();
    // Primer día del mes actual
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    // Último día del mes actual
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.filters.fechaDesde = formatDate(firstDay);
    this.filters.fechaHasta = formatDate(lastDay);
  }

  loadCatalogs() {
    this.catalogService.getItemsByCatalogCode(CATALOG_CODES.TIPOS_SOLICITUD)
      .subscribe(items => {
        this.requestTypes = items;
        items.forEach(item => {
          if (item.id) this.requestTypeMap[item.id] = item.name;
        });
      });
  }

  loadAllRecords() {
    this.loading = true;
    this.loadingService.show();
    this.recordService.getAllFilmRecords().subscribe({
      next: (data) => {
        this.allRecords = data;
        this.applyFilters();
        this.loading = false;
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error loading records', err);
        this.loading = false;
        this.loadingService.hide();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allRecords];

    // Text Search (Case Insensitive)
    if (this.filters.nroSolicitud) {
      const term = this.filters.nroSolicitud.toUpperCase();
      filtered = filtered.filter(r => r.nroSolicitud?.toUpperCase().includes(term));
    }
    if (this.filters.nroAsunto) {
      const term = this.filters.nroAsunto.toUpperCase();
      filtered = filtered.filter(r => r.nroAsunto?.toUpperCase().includes(term));
    }
    if (this.filters.solicitante) {
      const term = this.filters.solicitante.toUpperCase();
      filtered = filtered.filter(r => r.solicitante?.toUpperCase().includes(term));
    }

    // Exact Match
    if (this.filters.estado) {
      filtered = filtered.filter(r => r.estado === this.filters.estado);
    }
    if (this.filters.idTipoSolicitud) {
      filtered = filtered.filter(r => r.idTipoSolicitud === this.filters.idTipoSolicitud);
    }

    // Date Range
    if (this.filters.fechaDesde) {
      filtered = filtered.filter(r => r.fechaIngreso && r.fechaIngreso >= this.filters.fechaDesde);
    }
    if (this.filters.fechaHasta) {
      filtered = filtered.filter(r => r.fechaIngreso && r.fechaIngreso <= this.filters.fechaHasta);
    }

    // Sorting
    filtered.sort((a: any, b: any) => {
      const valA = a[this.sortField] || '';
      const valB = b[this.sortField] || '';
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredRecords = filtered;
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage() {
    this.totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.records = this.filteredRecords.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePage();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePage();
    }
  }

  toggleSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      fechaDesde: '',
      fechaHasta: '',
      nroSolicitud: '',
      nroAsunto: '',
      estado: '',
      solicitante: '',
      idTipoSolicitud: '',
    };
    this.setDefaultDates();
    this.applyFilters();
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

  deleteRecord(id: string | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este registro?')) {
      this.recordService.deleteFilmRecord(id).then(() => {
        this.loadAllRecords();
      });
    }
  }

  exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.filteredRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
    XLSX.writeFile(workbook, 'Registros_Filmicos.xlsx');
  }
}
