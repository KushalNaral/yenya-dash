import type {
  Partner,
  CreatePartnerData,
  UpdatePartnerData,
} from "@/types/partners/partner";
import { createBaseService } from "./baseService";

export const partnerService = createBaseService<
  Partner,
  CreatePartnerData,
  UpdatePartnerData
>("partners");
