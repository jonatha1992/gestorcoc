import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmRecordFormComponent } from './film-record-form';
import { ReactiveFormsModule } from '@angular/forms';
import { FilmRecordService } from '../../services/film-record';
import { CatalogService } from '../../services/catalog.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

describe('FilmRecordFormComponent', () => {
  let component: FilmRecordFormComponent;
  let fixture: ComponentFixture<FilmRecordFormComponent>;
  let mockFilmRecordService: any;
  let mockCatalogService: any;

  beforeEach(async () => {
    mockFilmRecordService = {
      getFilmRecordById: () => of({}),
      addFilmRecord: () => Promise.resolve(),
      updateFilmRecord: () => Promise.resolve()
    };

    mockCatalogService = {
      getItemsByCatalogCode: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [FilmRecordFormComponent, ReactiveFormsModule],
      providers: [
        { provide: FilmRecordService, useValue: mockFilmRecordService },
        { provide: CatalogService, useValue: mockCatalogService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} }
          }
        }
      ]
    })
      .overrideComponent(FilmRecordFormComponent, {
        set: { template: '<form></form>' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(FilmRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
