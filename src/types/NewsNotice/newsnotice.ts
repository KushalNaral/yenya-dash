type OmitKeys = "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "deleted_by";

export interface NewsNotice {
  id: number;
  name: string;
  description: string;
  slug: string;
  published_date: string;
  type: "news" | "notice";
  order: number;
  status: number;

  created_at: string;
  updated_at: string;

  created_by: number;
  updated_by: number;

  deleted_by: number;

  primary_asset?: {
    url: string;
    name?: string;
    id?: number;
  };
  assets: File | null | string;
}

export type CreateNewsNoticeData = Omit<NewsNotice, OmitKeys>;

export type UpdateNewsNoticeData = Partial<CreateNewsNoticeData> & {
  id: number;
};
