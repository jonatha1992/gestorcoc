import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RolePermission {
  role: string;
  role_label: string;
  permissions: string[];
  all_permissions: string[];
  is_system: boolean;  // Indica si es rol del sistema (no editable)
}

export interface CreateRolePayload {
  role_name: string;
  role_label: string;
  permissions: string[];
}

export interface PermissionInfo {
  code: string;
  label: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class RolePermissionsService {
  constructor(private api: ApiService) { }

  /**
   * Obtiene todos los roles con sus permisos
   */
  getRoles(): Observable<RolePermission[]> {
    return this.api.get<RolePermission[]>('api/roles/');
  }

  /**
   * Crea un nuevo rol personalizado
   */
  createRole(payload: CreateRolePayload): Observable<{ message: string; role: string; role_label: string; permissions: string[] }> {
    return this.api.post('api/roles/', payload);
  }

  /**
   * Elimina un rol personalizado
   */
  deleteRole(roleName: string): Observable<{ message: string }> {
    return this.api.delete(`api/roles/${roleName}/delete/`);
  }

  /**
   * Actualiza los permisos de un rol específico
   */
  updateRolePermissions(roleName: string, permissions: string[]): Observable<{ message: string; role: string; permissions: string[] }> {
    return this.api.post(`api/roles/${roleName}/permissions/`, { permissions });
  }

  /**
   * Obtiene información legible de cada permiso
   */
  getPermissionInfo(code: string): PermissionInfo {
    const categoryMap: Record<string, string> = {
      'view_dashboard': 'Dashboard',
      'view_assets': 'Activos',
      'manage_assets': 'Activos',
      'view_personnel': 'Personal',
      'manage_personnel': 'Personal',
      'view_novedades': 'Novedades',
      'manage_novedades': 'Novedades',
      'view_hechos': 'Hechos',
      'manage_hechos': 'Hechos',
      'view_records': 'Registros',
      'manage_records': 'Registros',
      'use_integrity_tools': 'Integridad',
      'verify_crev_record': 'CREV',
      'manage_crev_flow': 'CREV',
      'view_settings': 'Sistema',
      'manage_users': 'Usuarios',
    };

    const labelMap: Record<string, string> = {
      'view_dashboard': 'Ver Dashboard',
      'view_assets': 'Ver Activos',
      'manage_assets': 'Gestionar Activos',
      'view_personnel': 'Ver Personal',
      'manage_personnel': 'Gestionar Personal',
      'view_novedades': 'Ver Novedades',
      'manage_novedades': 'Gestionar Novedades',
      'view_hechos': 'Ver Hechos',
      'manage_hechos': 'Gestionar Hechos',
      'view_records': 'Ver Registros',
      'manage_records': 'Gestionar Registros e Informes',
      'use_integrity_tools': 'Usar Herramientas de Integridad',
      'verify_crev_record': 'Verificar CREV',
      'manage_crev_flow': 'Gestionar Flujo CREV',
      'view_settings': 'Ver Configuración',
      'manage_users': 'Gestionar Usuarios',
    };

    return {
      code,
      label: labelMap[code] || code,
      category: categoryMap[code] || 'Otros',
    };
  }

  /**
   * Agrupa permisos por categoría
   */
  getPermissionsByCategory(allPermissions: string[]): Map<string, PermissionInfo[]> {
    const categories = new Map<string, PermissionInfo[]>();

    for (const perm of allPermissions) {
      const info = this.getPermissionInfo(perm);
      const existing = categories.get(info.category) || [];
      existing.push(info);
      categories.set(info.category, existing);
    }

    // Ordenar categorías
    const sorted = new Map([...categories.entries()].sort());
    return sorted;
  }
}
