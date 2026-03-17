import type { Province } from "../provinces/province";

export interface District {
  ID?: number;
  PROVINCE_ID: number;
  NAME: string;
  CODE: string;
  PROVINCE_NAME?: string;
  province?: Province;
  created_at?: string;
  updated_at?: string;
}

export type CreateDistrictData = Omit<
  District,
  "ID" | "created_at" | "updated_at" | "PROVINCE_NAME"
>;
export type UpdateDistrictData = Partial<CreateDistrictData> & { ID?: number };
