export interface User {
  id: number;
  name: string;
  email: string;
  status?: number | string;
  verified_status?: string | number;
  permissions?: string[];
  roles?: string[];
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
  last_login_ago?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  status?: number | string;
  verified_status?: string | number;
}
