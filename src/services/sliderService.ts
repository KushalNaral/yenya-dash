import type { Slider, CreateSliderData, UpdateSliderData } from "@/types/sliders/slider";
import { createBaseService } from "./baseService";

export const sliderService = createBaseService<Slider, CreateSliderData, UpdateSliderData>(
  "sliders",
);
