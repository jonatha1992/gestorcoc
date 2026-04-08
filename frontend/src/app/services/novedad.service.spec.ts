import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NovedadService } from './novedad.service';

describe('NovedadService', () => {
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: NovedadService;

  beforeEach(() => {
    apiMock = {
      get: vi.fn(() => of({})),
      post: vi.fn(() => of({})),
      put: vi.fn(() => of({})),
      delete: vi.fn(() => of({})),
    };
    service = new NovedadService(apiMock as any);
  });

  // --- getNovedades ---

  it('getNovedades incluye page=1 por defecto', () => {
    service.getNovedades().subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('page=1');
  });

  it.each([
    ['search', { search: 'falla' }, 'search=falla'],
    ['status', { status: 'OPEN' }, 'status=OPEN'],
    ['severity', { severity: 'HIGH' }, 'severity=HIGH'],
    ['incident_type', { incident_type: 'Técnico' }, 'incident_type=T%C3%A9cnico'],
    ['asset_type', { asset_type: 'CAMERA' }, 'asset_type=CAMERA'],
    ['created_at__gte', { created_at__gte: '2024-01-01' }, 'created_at__gte=2024-01-01'],
    ['created_at__lte', { created_at__lte: '2024-12-31' }, 'created_at__lte=2024-12-31'],
    ['reported_by', { reported_by: 'admin' }, 'reported_by=admin'],
    ['camera', { camera: 5 }, 'camera=5'],
    ['server', { server: 2 }, 'server=2'],
    ['system', { system: 1 }, 'system=1'],
    ['cameraman_gear', { cameraman_gear: 3 }, 'cameraman_gear=3'],
  ] as const)(
    'getNovedades construye correctamente el filtro %s',
    (_label, filters, expectedParam) => {
      service.getNovedades(1, filters as any).subscribe();
      const url: string = apiMock.get.mock.calls[0][0];

      expect(url).toContain(expectedParam);
    },
  );

  it.each([
    ['camera', { camera: '' }],
    ['server', { server: null }],
    ['system', { system: undefined }],
    ['cameraman_gear', { cameraman_gear: '' }],
  ] as const)(
    'getNovedades omite el parámetro %s cuando está vacío/nulo',
    (_label, filters) => {
      service.getNovedades(1, filters as any).subscribe();
      const url: string = apiMock.get.mock.calls[0][0];

      expect(url).not.toContain(_label + '=');
    },
  );

  // --- CRUD ---

  it('createNovedad llama a POST con el payload correcto', () => {
    const data = { description: 'Cámara sin señal', severity: 'HIGH' };
    service.createNovedad(data).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/novedades/', data);
  });

  it('updateNovedad llama a PUT con id y payload correctos', () => {
    const data = { status: 'RESOLVED' };
    service.updateNovedad(12, data).subscribe();

    expect(apiMock.put).toHaveBeenCalledWith('api/novedades/12/', data);
  });

  it('deleteNovedad llama a DELETE con el endpoint correcto', () => {
    service.deleteNovedad(7).subscribe();

    expect(apiMock.delete).toHaveBeenCalledWith('api/novedades/7/');
  });
});
