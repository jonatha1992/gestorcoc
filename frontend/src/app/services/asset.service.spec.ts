import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetService } from './asset.service';

describe('AssetService', () => {
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
  let service: AssetService;

  beforeEach(() => {
    apiMock = {
      get: vi.fn(() => of({})),
      post: vi.fn(() => of({})),
      put: vi.fn(() => of({})),
      delete: vi.fn(() => of({})),
    };
    cacheMock = {
      withCache: vi.fn((_key, _ttl, source) => source),
      invalidate: vi.fn(),
    };
    service = new AssetService(apiMock as any, cacheMock as any);
  });

  it.each([
    ['createCamera', 'post', ['api/cameras/', { name: 'CAM-01' }], ['asset_cameras', 'asset_systems']],
    ['updateCamera', 'put', ['api/cameras/10/', { name: 'CAM-01' }], ['asset_cameras', 'asset_systems']],
    ['deleteCamera', 'delete', ['api/cameras/10/'], ['asset_cameras', 'asset_systems']],
  ] as const)(
    '%s invalidates camera and systems cache',
    (methodName, apiMethod, apiArgs, expectedInvalidations) => {
      (service[methodName] as (...args: any[]) => any)(...(apiArgs as any)).subscribe();

      expect(apiMock[apiMethod]).toHaveBeenCalledWith(...apiArgs);
      expect(cacheMock.invalidate.mock.calls.map(([key]) => key)).toEqual(expectedInvalidations);
    },
  );

  it.each([
    ['createServer', 'post', ['api/servers/', { name: 'SRV-01' }], ['asset_servers', 'asset_systems']],
    ['updateServer', 'put', ['api/servers/10/', { name: 'SRV-01' }], ['asset_servers', 'asset_systems']],
    ['deleteServer', 'delete', ['api/servers/10/'], ['asset_servers', 'asset_systems']],
  ] as const)(
    '%s invalidates server and systems cache',
    (methodName, apiMethod, apiArgs, expectedInvalidations) => {
      (service[methodName] as (...args: any[]) => any)(...(apiArgs as any)).subscribe();

      expect(apiMock[apiMethod]).toHaveBeenCalledWith(...apiArgs);
      expect(cacheMock.invalidate.mock.calls.map(([key]) => key)).toEqual(expectedInvalidations);
    },
  );
});
