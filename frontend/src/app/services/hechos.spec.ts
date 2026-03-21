import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Interceptamos el módulo @angular/core para que inject() devuelva el mock de api
vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return {
    ...actual,
    inject: vi.fn(),
  };
});

import { inject } from '@angular/core';
import { HechosService } from './hechos';

describe('HechosService', () => {
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: HechosService;

  beforeEach(() => {
    apiMock = {
      get: vi.fn(() => of({})),
      post: vi.fn(() => of({})),
      patch: vi.fn(() => of({})),
      delete: vi.fn(() => of(undefined)),
    };
    // Configuramos inject() para que devuelva nuestro mock cuando se solicite ApiService
    vi.mocked(inject).mockReturnValue(apiMock as any);

    service = new HechosService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockReturnValue(of({}));
    apiMock.post.mockReturnValue(of({}));
    apiMock.patch.mockReturnValue(of({}));
    apiMock.delete.mockReturnValue(of(undefined));
    vi.mocked(inject).mockReturnValue(apiMock as any);
  });

  // --- getHechos ---

  it('getHechos incluye page=1 por defecto', () => {
    service.getHechos().subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('page=1');
  });

  it.each([
    ['search', { search: 'robo' }, 'search=robo'],
    ['category', { category: 'POLICIAL' }, 'category=POLICIAL'],
    ['is_solved', { is_solved: 'true' }, 'is_solved=true'],
    ['camera', { camera: 4 }, 'camera=4'],
    ['coc_intervention', { coc_intervention: 'true' }, 'coc_intervention=true'],
    ['generated_cause', { generated_cause: 'false' }, 'generated_cause=false'],
    ['timestamp__gte', { timestamp__gte: '2024-01-01' }, 'timestamp__gte=2024-01-01'],
    ['timestamp__lte', { timestamp__lte: '2024-12-31' }, 'timestamp__lte=2024-12-31'],
  ] as const)(
    'getHechos construye correctamente el filtro %s',
    (_label, filters, expectedParam) => {
      service.getHechos(1, filters as any).subscribe();
      const url: string = apiMock.get.mock.calls[0][0];

      expect(url).toContain(expectedParam);
    },
  );

  it.each([
    ['is_solved', { is_solved: '' }],
    ['camera', { camera: '' }],
    ['coc_intervention', { coc_intervention: '' }],
    ['generated_cause', { generated_cause: '' }],
  ] as const)(
    'getHechos omite el parámetro %s cuando está vacío',
    (_label, filters) => {
      service.getHechos(1, filters as any).subscribe();
      const url: string = apiMock.get.mock.calls[0][0];

      expect(url).not.toContain(_label + '=');
    },
  );

  // --- CRUD ---

  it('createHecho llama a POST con el payload correcto', () => {
    const hecho = { description: 'Incidente en calle 25', category: 'POLICIAL' as const };
    service.createHecho(hecho).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/hechos/', hecho);
  });

  it('updateHecho llama a PATCH con id y payload correctos', () => {
    const changes = { is_solved: true };
    service.updateHecho(15, changes).subscribe();

    expect(apiMock.patch).toHaveBeenCalledWith('api/hechos/15/', changes);
  });

  it('deleteHecho llama a DELETE con el endpoint correcto', () => {
    service.deleteHecho(8).subscribe();

    expect(apiMock.delete).toHaveBeenCalledWith('api/hechos/8/');
  });
});
