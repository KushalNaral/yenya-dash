import apiClient from "@/api";
import type { AuthUser } from "@/types/auth";
import { useErrorHandler } from "@/composables/useErrorHandler";
import type { ApiResponse } from "@/types/generals";
import type { CreateUserData, UpdateUserData } from "@/types/users/user";

const { handleResponse, handleError } = useErrorHandler();

export const register = async (data: CreateUserData) => {
  try {
    const response = await apiClient.post("auth/user/register", data);
    return handleResponse(response.data, true);
  } catch (error: any) {
    handleError(error, { showToast: true, showDetails: false, duration: 3000 });
    throw error;
  }
};

export const login = async (data: AuthUser) => {
  const response = await apiClient.post("auth/login", data);
  return handleResponse(response.data);
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const response = await apiClient.patch(`users/${id}`, data);
  return handleResponse(response.data, true);
};

export const getUserForEdit = async (id: string) => {
  const response = await apiClient.get(`users/${id}`);
  return handleResponse(response.data);
};

export const forgotPassword = async (data: { email: string }) => {
  try {
    const res = await apiClient.post<ApiResponse<void>>("auth/forgot-password", data);
    return handleResponse(res.data);
  } catch (error: any) {
    handleError(error, {
      showToast: true,
      showDetails: true,
      duration: 5000,
    });
    throw error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const response = await apiClient.delete(`users/${id}`);
    return handleResponse(response.data, true, false, { showToast: true });
  } catch (error: any) {
    handleError(error, { showToast: false, showDetails: false, duration: 3000 });
    throw error;
  }
};

export const changeUserStatus = async () => {
  try {
    const response = await apiClient.post("auth/user/status");
    return handleResponse(response.data, true, false, { showToast: true });
  } catch (error: any) {
    handleError(error, {
      showToast: true,
      showDetails: true,
      duration: 5000,
    });
    throw error;
  }
};

export const listUsers = async (params: Record<string, any>) => {
  try {
    const response = await apiClient.get("users", { params });
    return response.data;
  } catch (error: any) {
    handleError(error, { showToast: false, showDetails: false, duration: 3000 });
    throw error;
  }
};

export const resetPassword = async (data: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) => {
  try {
    const res = await apiClient.post<ApiResponse<void>>("auth/reset-password", data);
    return handleResponse(res.data, true, false, { showToast: true });
  } catch (error: any) {
    handleError(error, {
      showToast: true,
      showDetails: true,
      duration: 5000,
    });
    throw error;
  }
};

export const logout = async () => {
  try {
    const res = await apiClient.post<ApiResponse<void>>("auth/logout", {}, {
      skipAuthErrorHandling: true,
    } as any);
    return handleResponse(res.data, false, false, { showToast: false });
  } catch (error: any) {
    console.error("Logout API call failed:", error);
    return null;
  }
};
