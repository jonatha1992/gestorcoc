const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface CameraPhotoDownload {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

function sanitizeCameraPhotoBaseName(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'camara';
}

export function buildCameraPhotoDownload(
  photoData: string,
  cameraName?: string | null,
): CameraPhotoDownload | null {
  const rawValue = String(photoData || '').trim();
  const match = rawValue.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return null;
  }

  const [, mimeType, payload] = match;
  const extension = MIME_EXTENSION_MAP[mimeType];
  if (!extension) {
    return null;
  }

  try {
    const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
    const baseName = sanitizeCameraPhotoBaseName(String(cameraName || '').trim() || 'camara');
    return {
      blob: new Blob([bytes], { type: mimeType }),
      fileName: `${baseName}.${extension}`,
      mimeType,
    };
  } catch {
    return null;
  }
}
