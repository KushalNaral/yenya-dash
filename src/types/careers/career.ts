export interface Career {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  requirements?: string;
  required_no?: string;
  position?: string;
  level?: string;
  validity?: string;
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

export interface CreateCareerData {
  name: string;
  slug?: string;
  description?: string;
  requirements?: string;
  required_no?: string;
  position?: string;
  level?: string;
  validity?: string;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdateCareerData extends Partial<CreateCareerData> {
  id?: number;
}
