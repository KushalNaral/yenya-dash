import apiClient from "@/api";
import type { ApiResponse } from "@/types/generals";
import { useErrorHandler } from "@/composables/useErrorHandler";
import type { Role, CreateRoleData, UpdateRoleData, AssignUserRolesData } from "@/types/auth";
import type { PaginatedResponse } from "@/types/pagination/pagination";

const { handleError, handleResponse } = useErrorHandler();

export const roleService = {
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Role[]>>("roles/all");
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

  listRoles: async (params: Record<string, any>): Promise<PaginatedResponse<Role>> => {
    try {
      const response = await apiClient.get<ApiResponse<Role[]>>("roles", { params });
      return response.data as PaginatedResponse<Role>;
    } catch (error: any) {
      handleError(error, {
        showToast: true,
        showDetails: true,
        duration: 5000,
      });
      throw error;
    }
  },

  createRole: async (data: CreateRoleData): Promise<Role> => {
    try {
      const res = await apiClient.post<ApiResponse<Role>>("roles", data);
      return handleResponse(res.data, true);
    } catch (error: any) {
      handleError(error, {
        showToast: true,
        showDetails: true,
        duration: 5000,
      });
      throw error;
    }
  },

  updateRole: async (id: number, data: UpdateRoleData): Promise<Role> => {
    try {
      const res = await apiClient.patch<ApiResponse<Role>>(`roles/${id}`, data);
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

  deleteRole: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`roles/${id}`);
    } catch (error: any) {
      handleError(error, {
        showToast: true,
        showDetails: true,
        duration: 5000,
      });
      throw error;
    }
  },

  assignRolesToUser: async (data: AssignUserRolesData): Promise<any> => {
    try {
      const res = await apiClient.post<ApiResponse<any>>("user-roles/assign", data);
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
};
