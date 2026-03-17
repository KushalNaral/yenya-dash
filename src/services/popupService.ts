import type { Popup, CreatePopupData, UpdatePopupData } from "@/types/popups/popup";
import { createBaseService } from "./baseService";

export const popupService = createBaseService<Popup, CreatePopupData, UpdatePopupData>("popups");
