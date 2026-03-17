export interface FaqCategory {
  id?: number;
  name: string;
  description?: string;
  status: 0 | 1;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFaqCategoryData {
  name: string;
  description?: string;
  status: 0 | 1;
  order?: number;
}

export interface UpdateFaqCategoryData extends Partial<CreateFaqCategoryData> {
  id?: number;
}
