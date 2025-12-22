import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmRecordListComponent } from './film-record-list';
import { FilmRecordService } from '../../services/film-record';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('FilmRecordListComponent', () => {
  let component: FilmRecordListComponent;
  let fixture: ComponentFixture<FilmRecordListComponent>;
  let mockFilmRecordService: any;

  beforeEach(async () => {
    mockFilmRecordService = {
      getFilmRecords: () => of([]),
      deleteFilmRecord: () => Promise.resolve()
    };

    await TestBed.configureTestingModule({
      imports: [FilmRecordListComponent],
      providers: [
        { provide: FilmRecordService, useValue: mockFilmRecordService },
        provideRouter([])
      ]
    })
      .overrideComponent(FilmRecordListComponent, {
        set: { template: '<table></table>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(FilmRecordListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
