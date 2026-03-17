export interface Province {
  ID?: number;
  NAME: string;
  CODE: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateProvinceData = Omit<Province, "ID" | "created_at" | "updated_at">;
export type UpdateProvinceData = Partial<CreateProvinceData> & { ID?: number };
