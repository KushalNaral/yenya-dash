export interface Popup {
  id?: number;
  name: string;
  title?: string;
  link_title?: string;
  link_url?: string;
  link?: string;
  status: 0 | 1;
  order?: number;
  start_time?: string;
  end_time?: string;
  primary_image?: {
    url: string;
    name?: string;
    id?: number;
  };
  assets?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreatePopupData {
  name: string;
  title?: string;
  link_title?: string;
  link_url?: string;
  link?: string;
  status: 0 | 1;
  order?: number;
  start_time?: string;
  end_time?: string;
  assets?: File | null | string;
}

export interface UpdatePopupData extends Partial<CreatePopupData> {
  id?: number;
}
