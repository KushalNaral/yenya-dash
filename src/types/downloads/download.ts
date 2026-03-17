export interface Download {
  id?: number;
  name: string;
  category_id: number;
  status: 0 | 1;
  category?: {
    id: number;
    name: string;
    slug?: string;
  };
  primary_file?: {
    url: string;
    name?: string;
    id?: number;
  };
  assets?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateDownloadData {
  name: string;
  category_id: number;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdateDownloadData extends Partial<CreateDownloadData> {
  id?: number;
}
