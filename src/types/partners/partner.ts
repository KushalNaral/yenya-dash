export interface Partner {
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

export interface CreatePartnerData {
  title: string;
  description?: string;
  link?: string;
  order: number;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  id?: number;
}
