import type {
  Stats,
  CreateStatsData,
  UpdateStatsData,
} from "@/types/stats/stats";
import { createBaseService } from "./baseService";

export const statsService = createBaseService<
  Stats,
  CreateStatsData,
  UpdateStatsData
>("stats");
