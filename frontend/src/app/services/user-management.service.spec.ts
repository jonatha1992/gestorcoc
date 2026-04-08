import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: UserManagementService;

  beforeEach(() => {
    apiMock = {
      get: vi.fn(() => of({})),
      post: vi.fn(() => of({})),
      patch: vi.fn(() => of({})),
      delete: vi.fn(() => of(undefined)),
    };
    service = new UserManagementService(apiMock as any);
  });

  // --- getUsers ---

  it('getUsers sin parámetros incluye page=1', () => {
    service.getUsers().subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('page=1');
  });

  it('getUsers con filtro search construye el parámetro correcto', () => {
    service.getUsers(1, 'Juan Pérez').subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('search=Juan%20P%C3%A9rez');
  });

  it('getUsers con filtro role construye el parámetro correcto', () => {
    service.getUsers(1, '', 'ADMIN').subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('role=ADMIN');
  });

  it('getUsers con filtro unit construye el parámetro correcto', () => {
    service.getUsers(1, '', '', 'COC-01').subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).toContain('unit__code=COC-01');
  });

  it('getUsers omite parámetros vacíos', () => {
    service.getUsers(1, '', '', '').subscribe();
    const url: string = apiMock.get.mock.calls[0][0];

    expect(url).not.toContain('search=');
    expect(url).not.toContain('role=');
    expect(url).not.toContain('unit__code=');
  });

  // --- createUser ---

  it('createUser llama a POST con el payload completo', () => {
    const payload = {
      username: 'jperez',
      password: 'pass1234',
      first_name: 'Juan',
      last_name: 'Pérez',
      badge_number: '123456',
      role: 'OPERATOR',
      rank: 'SGT',
      unit: 'COC-01',
    };
    service.createUser(payload).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/users/', payload);
  });

  // --- updateUser ---

  it('updateUser llama a PATCH con id y payload', () => {
    const changes = { role: 'SUPERVISOR', unit: 'COC-02' };
    service.updateUser(10, changes).subscribe();

    expect(apiMock.patch).toHaveBeenCalledWith('api/users/10/', changes);
  });

  // --- toggleActive ---

  it('toggleActive llama a POST al endpoint toggle_active', () => {
    service.toggleActive(5).subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/users/5/toggle_active/', {});
  });

  // --- resetPassword ---

  it('resetPassword llama a POST con la nueva contraseña', () => {
    service.resetPassword(3, 'nuevaClave123').subscribe();

    expect(apiMock.post).toHaveBeenCalledWith('api/users/3/reset_password/', {
      password: 'nuevaClave123',
    });
  });

  // --- deactivateUser ---

  it('deactivateUser llama a DELETE con el endpoint correcto', () => {
    service.deactivateUser(7).subscribe();

    expect(apiMock.delete).toHaveBeenCalledWith('api/users/7/');
  });
});
