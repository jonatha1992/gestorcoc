import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PersonnelService } from './personnel.service';

describe('PersonnelService', () => {
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let cacheMock: {
    withCache: ReturnType<typeof vi.fn>;
    invalidate: ReturnType<typeof vi.fn>;
  };
  let service: PersonnelService;

  beforeEach(() => {
    apiMock = {
      get: vi.fn(() => of({ results: [] })),
      post: vi.fn(() => of({})),
      put: vi.fn(() => of({})),
      delete: vi.fn(() => of({})),
    };
    cacheMock = {
      withCache: vi.fn((_key, _ttl, source$) => source$),
      invalidate: vi.fn(),
    };
    service = new PersonnelService(apiMock as any, cacheMock as any);
    vi.clearAllMocks();
    // Re-configure after clear so the default return value is preserved
    apiMock.get.mockReturnValue(of({ results: [] }));
    apiMock.post.mockReturnValue(of({}));
    apiMock.put.mockReturnValue(of({}));
    apiMock.delete.mockReturnValue(of({}));
    cacheMock.withCache.mockImplementation((_key: any, _ttl: any, source$: any) => source$);
  });

  // --- Lectura ---

  it('getPeople() sin argumentos usa caché con clave "personnel_people"', () => {
    service.getPeople().subscribe();

    expect(cacheMock.withCache).toHaveBeenCalledWith(
      'personnel_people',
      expect.any(Number),
      expect.anything(),
    );
  });

  it('getPeople(page) llama a la API con el parámetro page correcto', () => {
    service.getPeople(3, {}).subscribe();

    expect(apiMock.get).toHaveBeenCalledWith(expect.stringContaining('page=3'));
    // No debe usar caché cuando se especifica página
    expect(cacheMock.withCache).not.toHaveBeenCalled();
  });

  it.each([
    ['search', { search: 'López' }, 'search=L%C3%B3pez'],
    ['role', { role: 'OPERATOR' }, 'role=OPERATOR'],
    ['is_active', { is_active: 'true' }, 'is_active=true'],
    ['unit', { unit: 'COC-01' }, 'unit__code=COC-01'],
    ['guard_group', { guard_group: 'A' }, 'guard_group=A'],
  ] as const)(
    'getPeople construye correctamente el filtro %s',
    (_label, filters, expectedParam) => {
      service.getPeople(1, filters as any).subscribe();

      expect(apiMock.get).toHaveBeenCalledWith(expect.stringContaining(expectedParam));
    },
  );

  it('getPeople ignora is_active cuando está vacío', () => {
    service.getPeople(1, { is_active: '' }).subscribe();

    const url: string = apiMock.get.mock.calls[0][0];
    expect(url).not.toContain('is_active');
  });

  // --- Escritura e invalidación de caché ---

  it.each([
    ['createPerson', 'post', ['api/people/', { first_name: 'Ana' }]],
    ['updatePerson', 'put', ['api/people/5/', { first_name: 'Ana' }]],
    ['deletePerson', 'delete', ['api/people/5/']],
  ] as const)(
    '%s invalida la caché "personnel_people"',
    (method, apiMethod, apiArgs) => {
      (service[method] as (...args: any[]) => any)(...(apiArgs as any)).subscribe();

      expect(apiMock[apiMethod]).toHaveBeenCalledWith(...apiArgs);
      expect(cacheMock.invalidate).toHaveBeenCalledWith('personnel_people');
    },
  );

  it('createPerson llama a POST con el endpoint correcto', () => {
    const person = { first_name: 'Juan', last_name: 'Pérez' };
    service.createPerson(person).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/people/', person);
  });

  it('updatePerson llama a PUT con id y payload correctos', () => {
    const person = { first_name: 'Juan' };
    service.updatePerson(42, person).subscribe();

    expect(apiMock.put).toHaveBeenCalledWith('api/people/42/', person);
  });

  it('deletePerson llama a DELETE con endpoint correcto', () => {
    service.deletePerson(99).subscribe();

    expect(apiMock.delete).toHaveBeenCalledWith('api/people/99/');
  });
});
