export interface AuthenticatedUser {
  user_id: number;
  username: string;
  display_name: string;
  initials: string;
  role: string | null;
  permission_codes: string[];
  linked_person_id: number | null;
  must_change_password: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthenticatedUser;
}

export const PermissionCodes = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ASSETS: 'view_assets',
  MANAGE_ASSETS: 'manage_assets',
  VIEW_PERSONNEL: 'view_personnel',
  MANAGE_PERSONNEL: 'manage_personnel',
  VIEW_NOVEDADES: 'view_novedades',
  MANAGE_NOVEDADES: 'manage_novedades',
  VIEW_HECHOS: 'view_hechos',
  MANAGE_HECHOS: 'manage_hechos',
  VIEW_RECORDS: 'view_records',
  MANAGE_RECORDS: 'manage_records',  // Incluye crear/editar informes
  USE_INTEGRITY: 'use_integrity_tools',
  VERIFY_CREV: 'verify_crev_record',
  MANAGE_CREV_FLOW: 'manage_crev_flow',
  VIEW_SETTINGS: 'view_settings',
  MANAGE_USERS: 'manage_users',
} as const;

export type PermissionCode = (typeof PermissionCodes)[keyof typeof PermissionCodes];

export const RoleLabels: Record<string, string> = {
  READ_ONLY: 'Solo lectura',
  OPERADOR: 'Operador',
  COORDINADOR_COC: 'Coordinador COC',
  CREV: 'CREV',
  COORDINADOR_CREV: 'Coordinador CREV',
  ADMIN: 'Administrador',
};
