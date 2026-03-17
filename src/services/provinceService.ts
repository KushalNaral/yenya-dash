import type { Province, CreateProvinceData, UpdateProvinceData } from "@/types/provinces/province";
import { createBaseService } from "./baseService";

export const provinceService = createBaseService<Province, CreateProvinceData, UpdateProvinceData>(
  "province",
);
