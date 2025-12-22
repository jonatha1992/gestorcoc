import { TestBed } from '@angular/core/testing';
import { FilmRecordService } from './film-record';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment';

describe('FilmRecordService', () => {
  let service: FilmRecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FilmRecordService,
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
      ]
    });
    service = TestBed.inject(FilmRecordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
