import type {
  DownloadCategory,
  CreateDownloadCategoryData,
  UpdateDownloadCategoryData,
} from "@/types/downloadCategories/downloadCategory";
import { createBaseService } from "./baseService";

export const downloadCategoryService = createBaseService<
  DownloadCategory,
  CreateDownloadCategoryData,
  UpdateDownloadCategoryData
>("download-categories");
