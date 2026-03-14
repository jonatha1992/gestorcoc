import { describe, expect, it } from 'vitest';

import { buildCameraPhotoDownload } from './camera-photo.utils';

describe('buildCameraPhotoDownload', () => {
  it('creates a downloadable blob and sanitized file name from a valid data URL', async () => {
    const payload = btoa('PSA');
    const result = buildCameraPhotoDownload(`data:image/png;base64,${payload}`, 'Camara PSA 01');

    expect(result).not.toBeNull();
    expect(result?.fileName).toBe('Camara_PSA_01.png');
    expect(result?.mimeType).toBe('image/png');
    expect(result?.blob.type).toBe('image/png');
    await expect(result?.blob.text()).resolves.toBe('PSA');
  });

  it('returns null when the photo data is not a supported image data URL', () => {
    expect(buildCameraPhotoDownload('data:text/plain;base64,SG9sYQ==', 'Camara')).toBeNull();
    expect(buildCameraPhotoDownload('not-a-data-url', 'Camara')).toBeNull();
  });
});
