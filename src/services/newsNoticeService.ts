import type {
  NewsNotice,
  CreateNewsNoticeData,
  UpdateNewsNoticeData,
} from "@/types/NewsNotice/newsnotice";
import { createBaseService } from "./baseService";
import apiClient from "@/api";
import type { ApiResponse } from "@/types/generals";
import { useErrorHandler } from "@/composables/useErrorHandler";

const { handleResponse, handleError } = useErrorHandler();

const baseService = createBaseService<NewsNotice, CreateNewsNoticeData, UpdateNewsNoticeData>(
  "news-notices",
);

export const newsNoticeService = {
  ...baseService,
  /**
   * Reorder news notices by updating their order values.
   *
   * @param items Array of objects with id and order
   * @returns void
   */
  async reorder(items: Array<{ id: number; order: number }>): Promise<void> {
    try {
      const res = await apiClient.post<ApiResponse<void>>("news-notices/reorder", { items });
      handleResponse(res.data, false, false, { showToast: true });
    } catch (error: any) {
      handleError(error, { showToast: true, showDetails: true, duration: 5000 });
      throw error;
    }
  },
};
