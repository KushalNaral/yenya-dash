import type { Career, CreateCareerData, UpdateCareerData } from "@/types/careers/career";
import { createBaseService } from "./baseService";

export const careerService = createBaseService<Career, CreateCareerData, UpdateCareerData>(
  "career",
);
