export interface Menu {
  id?: number;
  title: string;
  link?: string | null;
  order?: number;
  slug?: string | null;
  target?: "_self" | "_blank";
  type?: "top" | "main" | "footer";
  footertype?: "quicklink" | "importantlink" | null;
  is_button?: boolean;
  parent_id?: number | null;
  status: 0 | 1;
  parent?: Menu | null;
  children?: Menu[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateMenuData {
  title: string;
  link?: string | null;
  order?: number;
  slug?: string | null;
  target?: "_self" | "_blank";
  type?: "top" | "main" | "footer";
  footertype?: "quicklink" | "importantlink" | null;
  is_button?: boolean;
  parent_id?: number | null;
  status: 0 | 1;
}

export interface UpdateMenuData extends Partial<CreateMenuData> {
  id?: number;
}
