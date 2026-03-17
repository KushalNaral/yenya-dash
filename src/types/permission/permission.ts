import type { ApiResponse } from "../generals";

export interface Permission {
  id: number;
  name: string;
  guard_name?: string;
}

export interface PermissionGrouped {
  [menuCode: string]: Permission[];
}

export interface RolePermissions {
  role_id: number;
  permissions: string[];
}
