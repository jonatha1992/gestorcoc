import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FilmRecordService } from '../../services/film-record';
import { FilmRecord } from '../../models/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-film-record-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './film-record-list.html',
  styleUrl: './film-record-list.css',
})
export class FilmRecordListComponent implements OnInit {
  private recordService = inject(FilmRecordService);
  records$: Observable<FilmRecord[]> = this.recordService.getFilmRecords();

  ngOnInit() { }

  deleteRecord(id: string | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este registro?')) {
      this.recordService.deleteFilmRecord(id);
    }
  }
}
