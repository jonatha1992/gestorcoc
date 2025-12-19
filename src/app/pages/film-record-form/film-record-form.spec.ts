import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilmRecordForm } from './film-record-form';

describe('FilmRecordForm', () => {
  let component: FilmRecordForm;
  let fixture: ComponentFixture<FilmRecordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilmRecordForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilmRecordForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
