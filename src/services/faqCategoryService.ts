import type {
  FaqCategory,
  CreateFaqCategoryData,
  UpdateFaqCategoryData,
} from "@/types/faqCategories/faqCategory";
import { createBaseService } from "./baseService";

export const faqCategoryService = createBaseService<
  FaqCategory,
  CreateFaqCategoryData,
  UpdateFaqCategoryData
>("faqcategory");
