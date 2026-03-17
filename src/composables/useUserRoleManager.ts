import { reactive } from "vue";
import apiClient from "@/api";
import type { ApiResponse } from "@/types/generals";
import { useErrorHandler } from "@/composables/useErrorHandler";

const { handleResponse } = useErrorHandler();

interface RoleCacheEntry {
  roles: string[];
  loading: boolean;
}

export function useUserRoleManager() {
  const cache = reactive<Record<number, RoleCacheEntry>>({});

  const loadUserRoles = async (userId: number, force = false) => {
    if (!userId) return;

    if (!force && cache[userId] && !cache[userId].loading) {
      return cache[userId].roles;
    }

    cache[userId] = { roles: [], loading: true };

    try {
      // Fetch user details which includes roles
      const response = await apiClient.get<ApiResponse<any>>(`users/${userId}`);
      const user = handleResponse(response.data);
      const roleNames = user?.roles || [];
      cache[userId] = { roles: roleNames, loading: false };
      return roleNames;
    } catch (error) {
      console.error(`Failed to load roles for user ${userId}:`, error);
      cache[userId] = { roles: [], loading: false };
      return [];
    }
  };

  const loadMultipleUserRoles = async (userIds: number[]) => {
    const promises = userIds.filter((id) => id && !cache[id]).map((id) => loadUserRoles(id));

    await Promise.allSettled(promises);
  };

  const clearCache = (userId?: number) => {
    if (userId) {
      delete cache[userId];
    } else {
      Object.keys(cache).forEach((key) => delete cache[Number(key)]);
    }
  };

  const refreshUserRoles = async (userId: number) => {
    return loadUserRoles(userId, true);
  };

  return {
    cache,
    loadUserRoles,
    loadMultipleUserRoles,
    clearCache,
    refreshUserRoles,
  };
}
