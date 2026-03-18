export interface Stats {
  id?: number;
  title: string;
  description?: string;
  link?: string;
  order: number;
  status: 0 | 1;
  primary_image?: {
    url: string;
    name?: string;
    id?: number;
  };
  assets?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateStatsData {
  title: string;
  description?: string;
  link?: string;
  order: number;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdateStatsData extends Partial<CreateStatsData> {
  id?: number;
}
