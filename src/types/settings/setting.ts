export interface Setting {
  id?: number;
  map_location?: string;
  location?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  site_title?: string;
  site_caption?: string;
  partner_title?: string;
  solution_title?: string;
  digital_title?: string;
  footer_title?: string;
  fb_link?: string;
  yt_link?: string;
  insta_link?: string;
  linkedin_link?: string;
  copyright?: string;
  is_maintainance_mode?: boolean;
  popup_duration?: number;
  primary_image?: {
    url: string;
    name?: string;
    id?: number;
  };
  assets?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateSettingData {
  map_location?: string;
  location?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  site_title?: string;
  site_caption?: string;
  partner_title?: string;
  solution_title?: string;
  digital_title?: string;
  footer_title?: string;
  fb_link?: string;
  yt_link?: string;
  insta_link?: string;
  linkedin_link?: string;
  copyright?: string;
  is_maintainance_mode?: boolean;
  popup_duration?: number;
  assets?: File | null | string;
}

export interface UpdateSettingData extends Partial<CreateSettingData> {
  id?: number;
}
