export interface Setting {
  id?: number;
  information_officer_name?: string;
  information_officer_number?: string;
  information_officer_email?: string;
  map_location?: string;
  location?: string;
  email?: string;
  phone?: string;
  fb_link?: string;
  yt_link?: string;
  insta_link?: string;
  linkedin_link?: string;
  copyright?: string;
  is_maintainance_mode?: boolean;
  inflation_rate?: string;
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
  information_officer_name?: string;
  information_officer_number?: string;
  information_officer_email?: string;
  map_location?: string;
  location?: string;
  email?: string;
  phone?: string;
  fb_link?: string;
  yt_link?: string;
  insta_link?: string;
  linkedin_link?: string;
  copyright?: string;
  is_maintainance_mode?: boolean;
  inflation_rate?: string;
  popup_duration?: number;
  assets?: File | null | string;
}

export interface UpdateSettingData extends Partial<CreateSettingData> {
  id?: number;
}
