import { defineStore } from "pinia";
import { ref, computed } from "vue";
import encryption from "@/helpers/Encryption";
import cookies from "@/helpers/cookies";
import type { AuthUser } from "@/types/auth";
import type { User } from "@/types/users/user";
import apiClient from "@/api";
import type { ApiResponse } from "@/types/generals";
import { useErrorHandler } from "@/composables/useErrorHandler";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const user = ref<User | null>(null);
    const token = ref<AuthUser["token"] | null>(null);
    const permissions = ref<string[]>([]);
    const isLoggingOut = ref<boolean>(false);

    const isAuthenticated = ref<boolean>(false);

    const hasPermission = computed(
      () => (permission: string) => permissions.value.includes(permission),
    );

    const hasAnyPermission = computed(
      () => (requiredPermissions: string[]) =>
        requiredPermissions.some((permission) => permissions.value.includes(permission)),
    );

    const hasAllPermissions = computed(
      () => (requiredPermissions: string[]) =>
        requiredPermissions.every((permission) => permissions.value.includes(permission)),
    );

    const userFullName = computed(() => (user.value ? `${user.value.username}` : ""));

    const getUserInfo = async () => {
      return { user: user.value, permissions: permissions.value, token: token.value };
    };

    const setUser = (userData: User | null) => {
      user.value = userData;
      if (userData) {
        cookies.setEncrypted("user", userData);
      } else {
        cookies.remove("user");
      }
    };

    const setToken = (newToken: AuthUser["token"] | null) => {
      token.value = newToken;
      if (newToken) {
        cookies.setEncrypted("auth_token", newToken);
      } else {
        cookies.remove("auth_token");
      }
    };

    const setPermissions = (newPermissions: string[]) => {
      permissions.value = newPermissions;
    };

    const logout = async () => {
      if (isLoggingOut.value) {
        return;
      }

      isLoggingOut.value = true;

      try {
        const currentToken = token.value;

        if (currentToken) {
          try {
            const { logout: logoutService } = await import("@/services/authService");
            await logoutService();
          } catch (error) {
            console.error("Logout API error:", error);
          }
        }
      } finally {
        setUser(null);
        setToken(null);
        setPermissions([]);
        isAuthenticated.value = false;
        cookies.remove("auth_token");
        cookies.remove("user");
        try {
          sessionStorage.removeItem("auth");
        } catch (error) {
          console.error("Failed to clear sessionStorage:", error);
        }
        isLoggingOut.value = false;
      }
    };

    const login = async (email: string, password: string) => {
      const { handleResponse, handleError } = useErrorHandler();

      try {
        const response = await apiClient.post<ApiResponse<AuthUser>>("auth/login", {
          email,
          password,
        });

        const authData = handleResponse(response.data, true, true, {
          showToast: true,
          duration: 5000,
        });

        if (authData.user) {
          setUser(authData.user);
          setPermissions(authData.user.permissions || []);
        }

        if (authData.token) {
          setToken(authData.token);
        }

        isAuthenticated.value = true;
      } catch (error) {
        handleError(error as Error, {
          showToast: true,
          duration: 5000,
        });
        throw error;
      }
    };

    const initialize = async () => {
      if (token.value) {
        try {
          await getUserInfo();
          return true;
        } catch (error) {
          console.error("Failed to fetch user profile:", (error as Error).message);
          logout();
          return false;
        }
      }
    };

    return {
      user,
      token,
      permissions,
      isLoggingOut,
      isAuthenticated,
      hasPermission,
      userFullName,
      hasAnyPermission,
      hasAllPermissions,
      setUser,
      getUserInfo,
      setToken,
      setPermissions,
      logout,
      login,
      initialize,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      serializer: {
        deserialize: (encryptedState: string) => JSON.parse(encryption.decrypt(encryptedState)),
        serialize: (state: unknown) => encryption.encrypt(JSON.stringify(state)),
      },
      key: "auth",
      pick: ["user", "permissions", "token", "isAuthenticated"],
    },
  },
);
