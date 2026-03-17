import apiClient from "@/api";
import { useErrorHandler } from "@/composables/useErrorHandler";
import type { ApiResponse } from "@/types/generals";

const { handleError, handleResponse } = useErrorHandler();

export interface DashboardItem {
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string | number;
  color: string;
  link?: string;
}

export interface DashboardDataResponse {
  status: string;
  data: string | DashboardItem[]; // PHP code suggests it might return HTML but for Vue we want JSON
}

export const dashboardService = {
  /**
   * Fetches surveillance data for a specific type, year, and district.
   * Types: 1:AFP, 2:Measles, 3:AES, 4:NNT, 5:CRS, 6:Measles Outbreak, 7:AFP Follow-up, 8:Notified AFP
   */
  async getSurveillanceData(
    type: number,
    year: string,
    districtId: string,
  ): Promise<DashboardItem[]> {
    try {
      const res = await apiClient.get<ApiResponse<DashboardItem[]>>(
        `/dashboard/ajax_getData/${type}/${year}/${districtId}`,
      );
      return handleResponse(res.data);
    } catch (error: any) {
      handleError(error, { showToast: false, showDetails: false, duration: 3000 });
      throw error;
    }
  },

  /**
   * Fetches COVID-19 data for a specific type, date range, and district.
   * Types: 9:Total/Cases, 10:Symptomatic, 11:Travel History, 12:Outcome
   */
  async getCovidData(
    type: number,
    startDate: string,
    endDate: string,
    districtId: string,
  ): Promise<DashboardItem[]> {
    try {
      const res = await apiClient.get<ApiResponse<DashboardItem[]>>(
        `/dashboard/covid_getData/${type}/${startDate}/${endDate}/${districtId}`,
      );
      return handleResponse(res.data);
    } catch (error: any) {
      handleError(error, { showToast: false, showDetails: false, duration: 3000 });
      throw error;
    }
  },
};

export default dashboardService;
