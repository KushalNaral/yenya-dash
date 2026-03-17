import type { Setting, CreateSettingData, UpdateSettingData } from "@/types/settings/setting";
import { createBaseService } from "./baseService";

export const settingService = createBaseService<
  Setting,
  CreateSettingData,
  UpdateSettingData
>("settings");
