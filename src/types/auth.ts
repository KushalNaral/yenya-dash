import type { User } from "./users/user";

export interface AuthUser {
  user: User;
  token: string;
}

export interface Role {
  id: number;
  name: string;
  permissions?: string[];
}

export interface CreateRoleData {
  name: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name: string;
  permissions?: string[];
}

export interface AssignUserRolesData {
  user_id: number;
  roles: string[];
}
