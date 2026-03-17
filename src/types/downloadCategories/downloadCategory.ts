export interface DownloadCategory {
  id?: number;
  name: string;
  slug?: string;
  status: 0 | 1;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDownloadCategoryData {
  name: string;
  status: 0 | 1;
  order?: number;
}

export interface UpdateDownloadCategoryData extends Partial<CreateDownloadCategoryData> {
  id?: number;
  slug?: string;
}
