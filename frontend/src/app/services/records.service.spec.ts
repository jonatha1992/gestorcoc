import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordsService } from './records.service';

describe('RecordsService', () => {
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let httpMock: { post: ReturnType<typeof vi.fn> };
  let service: RecordsService;

  beforeEach(() => {
    apiMock = {
      get: vi.fn(() => of({})),
      post: vi.fn(() => of({})),
      patch: vi.fn(() => of({})),
      delete: vi.fn(() => of({})),
    };
    httpMock = {
      post: vi.fn(() => of(new Blob())),
    };
    service = new RecordsService(apiMock as any, httpMock as any);
  });

  // --- getRecords ---

  it('getRecords sin filtros incluye page=1 por defecto', () => {
    service.getRecords().subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('page=1');
  });

  it.each([
    ['search', { search: 'cámara' }, 'search=c%C3%A1mara'],
    ['delivery_status', { delivery_status: 'DELIVERED' }, 'delivery_status=DELIVERED'],
    ['is_integrity_verified', { is_integrity_verified: 'true' }, 'is_integrity_verified=true'],
    ['has_backup', { has_backup: 'false' }, 'has_backup=false'],
    ['camera', { camera: 7 }, 'camera=7'],
    ['operator', { operator: 3 }, 'operator=3'],
    ['received_by', { received_by: 2 }, 'received_by=2'],
    ['verified_by_crev', { verified_by_crev: 1 }, 'verified_by_crev=1'],
    ['entry_date__gte', { entry_date__gte: '2024-01-01' }, 'entry_date__gte=2024-01-01'],
    ['entry_date__lte', { entry_date__lte: '2024-12-31' }, 'entry_date__lte=2024-12-31'],
  ] as const)(
    'getRecords construye correctamente el filtro %s',
    (_label, filters, expectedParam) => {
      service.getRecords(1, filters as any).subscribe();
      const url: string = apiMock.get.mock.calls[0][0];

      expect(url).toContain(expectedParam);
    },
  );

  it.each([
    ['is_integrity_verified', { is_integrity_verified: '' }],
    ['has_backup', { has_backup: '' }],
    ['camera', { camera: '' }],
    ['operator', { operator: null }],
  ] as const)(
    'getRecords omite el parámetro %s cuando está vacío o nulo',
    (_label, filters) => {
      service.getRecords(1, filters as any).subscribe();
      const url: string = apiMock.get.mock.calls[0][0];

      expect(url).not.toContain(_label);
    },
  );

  // --- CRUD ---

  it('createRecord llama a POST con el payload correcto', () => {
    const record = { camera: 1, operator: 2 };
    service.createRecord(record).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/film-records/', record);
  });

  it('updateRecord llama a PATCH con id y payload', () => {
    const changes = { delivery_status: 'DELIVERED' };
    service.updateRecord(10, changes).subscribe();

    expect(apiMock.patch).toHaveBeenCalledWith('api/film-records/10/', changes);
  });

  it('deleteRecord llama a DELETE con el endpoint correcto', () => {
    service.deleteRecord(5).subscribe();

    expect(apiMock.delete).toHaveBeenCalledWith('api/film-records/5/');
  });

  // --- Acciones especiales ---

  it('verifyByCrev llama a POST con id y observaciones', () => {
    service.verifyByCrev(3, 'Sin observaciones').subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/film-records/3/verify_by_crev/', {
      observations: 'Sin observaciones',
    });
  });

  it('verifyByCrev usa texto vacío como observaciones por defecto', () => {
    service.verifyByCrev(3).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/film-records/3/verify_by_crev/', {
      observations: '',
    });
  });

  it('getCatalogs llama a GET en el endpoint de catálogos', () => {
    service.getCatalogs().subscribe();

    expect(apiMock.get).toHaveBeenCalledWith('api/catalogs/');
  });
});
