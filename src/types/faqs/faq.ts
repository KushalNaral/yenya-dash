export interface Faq {
  id?: number;
  name: string;
  description?: string;
  question?: string;
  answer?: string;
  status: 0 | 1;
  order?: number;
  faq_category_id?: number;
  faq_category?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateFaqData {
  name: string;
  description?: string;
  question?: string;
  answer?: string;
  status: 0 | 1;
  order?: number;
  faq_category_id?: number;
}

export interface UpdateFaqData extends Partial<CreateFaqData> {
  id?: number;
}
