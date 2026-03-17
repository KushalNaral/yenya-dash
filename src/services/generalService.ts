import apiClient from "@/api";
import type { ApiResponse, EpidNumberData } from "@/types/generals";
import { useErrorHandler } from "@/composables/useErrorHandler";
import { normalizeDate } from "@/helpers/essentials";

const { handleError, handleResponse } = useErrorHandler();

export const generalService = {
  getDefaultYear: async () => {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/v1/years/default");
      return handleResponse(res.data);
    } catch (error: any) {
      handleError(error, {
        showToast: true,
        showDetails: true,
        duration: 5000,
      });
      throw error;
    }
  },

  async getEpidNumber(data: EpidNumberData, options?: { signal?: AbortSignal }): Promise<string> {
    try {
      const params: Record<string, any> = {
        type: data.type,
        master_id: data.master_id,
        date: data.date ? normalizeDate(new Date(data.date)) : undefined,
        district_id: data.district_id ? data.district_id : undefined,
      };
      const res = await apiClient.get<ApiResponse<string>>("/custom/get-epid-number", {
        params,
        signal: options?.signal,
      });

      return handleResponse(res.data);
    } catch (error: any) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        throw error;
      }
      handleError(error, { showToast: true, showDetails: true, duration: 5000 });
      throw error;
    }
  },
};
