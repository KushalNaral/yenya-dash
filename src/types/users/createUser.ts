import type { Status, VerifiedStatus } from "@/types/generals";

export interface CreateUser {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  password: string;
  password_confirmation: string;
  status: Status;
  verified_status: VerifiedStatus;
  designation?: string;
  phone?: number;
  district_ids?: number[];
  role_id: number;
  field_office_name?: string;
  lab_name?: string;
}
