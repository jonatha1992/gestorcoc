import { TestBed } from '@angular/core/testing';

import { FilmRecord } from './film-record';

describe('FilmRecord', () => {
  let service: FilmRecord;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilmRecord);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
