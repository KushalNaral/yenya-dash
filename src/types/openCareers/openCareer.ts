export interface OpenCareer {
  id?: number;
  full_name: string;
  phone_number?: string;
  email?: string;
  cover_letter?: string;
  position_applied?: string;
  experience?: string;
  status: 0 | 1;
  primary_file?: {
    url: string;
    name?: string;
    id?: number;
  };
  assets?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateOpenCareerData {
  full_name: string;
  phone_number?: string;
  email?: string;
  cover_letter?: string;
  position_applied?: string;
  experience?: string;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdateOpenCareerData extends Partial<CreateOpenCareerData> {
  id?: number;
}
