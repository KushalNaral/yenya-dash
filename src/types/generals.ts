import type { PaginationMeta } from "./pagination/pagination";
import type { AuthUser } from "./auth";

// ... (enums omitted)

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface AuthCallbackResponse {
  access_token: string;
  token_type: "Bearer";
  user?: AuthUser;
}

export interface RedirectResponse {
  redirect_url: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface GeoLocationCoordinates {
  latitude: number;
  longitude: number;
}

export type EpidNumberType = "AFP" | "MSL" | "CRS" | "AES" | "NNT";

export interface EpidNumberData {
  type: EpidNumberType;
  master_id: number;
  date?: Date | string;
  district_id?: number;
}
