export interface ContactUs {
  id?: number;
  name: string;
  address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  fax?: string | null;
  map_location?: string | null;
  focal_person?: string | null;
  is_head_office?: boolean | null;
  status: 0 | 1;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContactUsData {
  name: string;
  address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  fax?: string | null;
  map_location?: string | null;
  focal_person?: string | null;
  is_head_office?: boolean | null;
  status: 0 | 1;
}

export interface UpdateContactUsData extends Partial<CreateContactUsData> {
  id?: number;
}
