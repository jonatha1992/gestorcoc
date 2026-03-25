/**
 * Normalización de datos de Novedades
 * 
 * Funciones puras para transformar datos crudos de la API
 * en el formato esperado por los componentes
 */

type NovedadSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type NovedadStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
type NovedadAssetType = 'CAMERA' | 'SERVER' | 'SYSTEM' | 'GEAR' | 'UNKNOWN';

export interface NovedadViewModel {
  id: number;
  created_at: string;
  updated_at?: string;
  camera: number | null;
  server: number | null;
  system: number | null;
  cameraman_gear: number | null;
  camera_name: string;
  server_name: string;
  system_name: string;
  cameraman_gear_name: string;
  severity: NovedadSeverity;
  status: NovedadStatus;
  incident_type: string;
  reported_by: string;
  description: string;
  assetLabel: string;
  assetType: NovedadAssetType;
  coc_ticket_number?: string | null;
  [key: string]: any;
}

/**
 * Convierte cualquier valor a un ID numérico válido
 */
export function toId(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'object' && value !== null) {
    return toId((value as any).id);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Limpia y normaliza texto
 */
export function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

/**
 * Valida si un valor es una severidad válida
 */
export function isValidSeverity(value: unknown): value is NovedadSeverity {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL';
}

/**
 * Valida si un valor es un estado válido
 */
export function isValidStatus(value: unknown): value is NovedadStatus {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'CLOSED';
}

/**
 * Normaliza una fila cruda de novedad al formato ViewModel
 */
export function normalizeNovedadRow(raw: any): NovedadViewModel {
  const cameraId = toId(raw?.camera);
  const serverId = toId(raw?.server);
  const systemId = toId(raw?.system);
  const gearId = toId(raw?.cameraman_gear);

  const cameraName = cleanText(raw?.camera_name || raw?.camera?.name);
  const serverName = cleanText(raw?.server_name || raw?.server?.name);
  const systemName = cleanText(raw?.system_name || raw?.system?.name);
  const gearName = cleanText(raw?.cameraman_gear_name || raw?.cameraman_gear?.name);

  const assetLabel = cameraName || serverName || systemName || gearName || 'Desconocido';
  const assetType: NovedadAssetType = cameraId
    ? 'CAMERA'
    : serverId
      ? 'SERVER'
      : systemId
        ? 'SYSTEM'
        : gearId
          ? 'GEAR'
          : 'UNKNOWN';

  const severity = isValidSeverity(raw?.severity) ? raw.severity : 'MEDIUM';
  const status = isValidStatus(raw?.status) ? raw.status : 'OPEN';

  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    created_at: cleanText(raw?.created_at) || new Date().toISOString(),
    camera: cameraId,
    server: serverId,
    system: systemId,
    cameraman_gear: gearId,
    camera_name: cameraName,
    server_name: serverName,
    system_name: systemName,
    cameraman_gear_name: gearName,
    severity,
    status,
    incident_type: cleanText(raw?.incident_type) || 'SIN_CLASIFICAR',
    reported_by: cleanText(raw?.reported_by) || '',
    description: cleanText(raw?.description) || 'Sin descripción',
    assetLabel,
    assetType,
    coc_ticket_number: cleanText(raw?.coc_ticket_number) || null,
  };
}

/**
 * Obtiene la etiqueta legible para la severidad
 */
export function getSeverityLabel(severity: string): string {
  const map: Record<string, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };
  return map[severity] || severity;
}

/**
 * Obtiene la etiqueta legible para el tipo de novedad
 */
export function getNovedadTypeLabel(novedad: any): string {
  if (novedad.assetType === 'CAMERA' || novedad.camera_name || novedad.camera) return 'CÁMARA';
  if (novedad.assetType === 'SERVER' || novedad.server_name || novedad.server) return 'SERVIDOR';
  if (novedad.assetType === 'SYSTEM' || novedad.system_name || novedad.system) return 'SISTEMA';
  if (novedad.assetType === 'GEAR' || novedad.cameraman_gear_name || novedad.cameraman_gear) return 'EQUIPAMIENTO';
  return 'GENÉRICO';
}

/**
 * Convierte fecha a inicio del día en formato ISO
 */
export function toStartOfDayIso(dateValue: string): string | undefined {
  if (!dateValue) return undefined;
  return `${dateValue}T00:00:00`;
}

/**
 * Convierte fecha a fin del día en formato ISO
 */
export function toEndOfDayIso(dateValue: string): string | undefined {
  if (!dateValue) return undefined;
  return `${dateValue}T23:59:59`;
}
