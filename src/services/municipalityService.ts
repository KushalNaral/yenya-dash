import type {
  Municipality,
  CreateMunicipalityData,
  UpdateMunicipalityData,
} from "@/types/municipalitys/municipality";
import { createBaseService } from "./baseService";

export const municipalityService = createBaseService<
  Municipality,
  CreateMunicipalityData,
  UpdateMunicipalityData
>("municipality");
