import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilmRecordList } from './film-record-list';

describe('FilmRecordList', () => {
  let component: FilmRecordList;
  let fixture: ComponentFixture<FilmRecordList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilmRecordList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilmRecordList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
