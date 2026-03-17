import type { Status } from "../generals";

export interface DistrictPopulation {
  id?: number;
  district_id: number;
  district_name?: string;
  year_id: number;
  year_name?: string;
  total_population: number;
  under_1: number;
  under_5: number;
  under_15: number;
  status: Status;
  created_at?: string;
  updated_at?: string;
}

export type DistrictPopulationCreate = Omit<
  DistrictPopulation,
  "id" | "created_at" | "updated_at" | "district_name" | "year_name"
>;
export type DistrictPopulationUpdate = Partial<DistrictPopulationCreate> & { id?: number };
