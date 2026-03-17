export interface Slider {
  id?: number;
  title: string;
  description: string;
  link_title?: string;
  link_url?: string;
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

export interface CreateSliderData {
  title: string;
  description: string;
  link_title?: string;
  link_url?: string;
  order: number;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdateSliderData extends Partial<CreateSliderData> {
  id?: number;
}
