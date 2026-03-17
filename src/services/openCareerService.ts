import type {
  OpenCareer,
  CreateOpenCareerData,
  UpdateOpenCareerData,
} from "@/types/openCareers/openCareer";
import { createBaseService } from "./baseService";

export const openCareerService = createBaseService<
  OpenCareer,
  CreateOpenCareerData,
  UpdateOpenCareerData
>("open-career");
