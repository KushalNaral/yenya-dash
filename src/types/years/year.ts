import type { Status } from "../generals";

export interface Year {
  id?: number;
  year: string;
  order: number;
  status: Status;
  created_at?: string;
  updated_at?: string;
}

export type CreateYearData = Omit<Year, "id" | "created_at" | "updated_at">;
export type UpdateYearData = Partial<CreateYearData> & { id?: number };
