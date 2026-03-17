import apiClient from "@/api";
import { useErrorHandler } from "@/composables/useErrorHandler";
import type { ApiResponse } from "@/types/generals";
import type { Permission } from "@/types/permission/permission";

const { handleError, handleResponse } = useErrorHandler();

export const permissionService = {
  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Permission[]>>("permission/all");
      return handleResponse(response.data);
    } catch (error: any) {
      handleError(error, {
        showToast: true,
        showDetails: true,
        duration: 5000,
      });
      throw error;
    }
  },
};
