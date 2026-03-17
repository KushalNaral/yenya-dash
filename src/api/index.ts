import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/auth";
import { useLoadingStore } from "@/stores/loading";
import router from "@/router";
import CryptoJS from "crypto-js";

const API_URL = import.meta.env.VITE_API_URL as string;
const DECRYPTION_KEY = import.meta.env.VITE_API_APP_KEY as string;
const RESPONSE_ENCRYPTION = import.meta.env.VITE_API_RESPONSE_ENCRYPTION == "true";
const REQUEST_ENCRYPTION = import.meta.env.VITE_API_REQUEST_ENCRYPTION == "true";

interface ErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, string>;
}

interface RetryConfig {
  retry?: number;
}

const ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input and try again.",
  401: "You are not authenticated. Please log in.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  419: "Session expired. Please refresh and try again.",
  422: "Validation failed. Please check your input.",
  429: "Too many requests. Please try again later.",
  500: "An unexpected error occurred. Please try again later.",
};
// Endpoints requiring year_id
// const YEAR_ID_ENDPOINTS = [
//   "institutions",
//   "institution-types",
//   "institution-users",
//   "users",
//   "user-roles",
//   "sectors",
//   "tags",
//   "activities",
//   "strategies",
//   "policies",
//   "investments",
// ];

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL + "v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
  withCredentials: true,
});

const publicApiClient: AxiosInstance = axios.create({
  baseURL: API_URL + "v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
  withCredentials: false, // No credentials for public routes
});

type LoadingConfig = AxiosRequestConfig & {
  skipGlobalLoading?: boolean;
  __trackLoading?: boolean;
  skipAuthErrorHandling?: boolean;
};

// Auth endpoints that should not trigger logout on 401
const AUTH_ENDPOINTS = [
  "/login",
  "/register",
  "/logout",
  "/forgot-password",
  "/reset-password",
] as const;

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function markLoading(config: LoadingConfig) {
  const shouldTrack = !config.skipGlobalLoading;
  if (shouldTrack) {
    useLoadingStore().startRequest();
  }
  config.__trackLoading = shouldTrack;
}

function unmarkLoading(config?: LoadingConfig) {
  if (config?.__trackLoading) {
    useLoadingStore().endRequest();
  }
}
async function fetchProfile(): Promise<unknown> {
  try {
    const response = await apiClient.get("/api/user");
    return response.data;
  } catch (error) {
    console.error("apiClient: Failed to fetch user profile:", (error as Error).message);
    throw error;
  }
}

apiClient.interceptors.request.use(
  async (config) => {
    markLoading(config as LoadingConfig);
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    // Encrypt request data if enabled
    if (
      REQUEST_ENCRYPTION &&
      config.data &&
      ["post", "put", "patch"].includes(config.method?.toLowerCase() || "")
    ) {
      try {
        const jsonData = JSON.stringify(config.data);
        const encrypted = CryptoJS.AES.encrypt(jsonData, DECRYPTION_KEY).toString();
        config.data = { payload: encrypted };
      } catch (encryptError) {
        console.error("apiClient: Request encryption failed:", encryptError);
        throw new Error("Failed to encrypt API request");
      }
    }

    return config;
  },
  (error) => {
    unmarkLoading(error.config as LoadingConfig);
    console.error("apiClient: Request setup failed:", error);
    return Promise.reject(error);
  },
);

publicApiClient.interceptors.request.use(
  (config) => {
    markLoading(config as LoadingConfig);
    return config;
  },
  (error) => {
    unmarkLoading(error.config as LoadingConfig);
    console.error("publicApiClient: Request setup failed:", error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    unmarkLoading(response.config as LoadingConfig);
    try {
      if (RESPONSE_ENCRYPTION && response.data.payload) {
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(response.data.payload, DECRYPTION_KEY);
          const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedData) {
            throw new Error("Empty decrypted data");
          }
          const parsedData = JSON.parse(decryptedData);
          return { ...response, data: parsedData };
        } catch (decryptError) {
          console.error("apiClient: Decryption failed:", decryptError);
          throw new Error("Failed to decrypt API response");
        }
      }
      return response;
    } catch (error) {
      console.error("apiClient: Response processing failed:", error);
      throw error;
    }
  },
  async (error: AxiosError<ErrorResponse>) => {
    unmarkLoading(error.config as LoadingConfig);
    const status = error.response?.status;
    let message = error.message;

    if (status) {
      message = error.response?.data?.message || ERROR_MESSAGES[status] || "An error occurred";

      if (status === 401) {
        const config = error.config as LoadingConfig | undefined;
        const shouldSkipAuthErrorHandling =
          config?.skipAuthErrorHandling || isAuthEndpoint(config?.url);

        if (!shouldSkipAuthErrorHandling) {
          const authStore = useAuthStore();
          if (authStore.token && !authStore.isLoggingOut) {
            await authStore.logout();
            router.push({ name: "Login" });
          }
        }
      }

      if (status === 403) {
        const config = error.config as LoadingConfig | undefined;
        const shouldSkipAuthErrorHandling =
          config?.skipAuthErrorHandling || isAuthEndpoint(config?.url);

        if (!shouldSkipAuthErrorHandling) {
          const currentPath = window.location.pathname;
          router.push({
            name: "AccessDenied",
            query: { from: currentPath },
          });
        }
      }

      if ([429, 503].includes(status)) {
        const config = error.config || {};
        const retryConfig = config as RetryConfig;
        retryConfig.retry = (retryConfig.retry || 0) + 1;
        if (retryConfig.retry <= 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryConfig.retry || 1)));
          return apiClient(config);
        }
      }
    }

    console.error("apiClient: API request failed:", {
      status,
      message: error.response?.data?.message,
      errors: error.response?.data?.errors,
      url: error.config?.url,
    });

    const customError = new Error(message) as Error & {
      cause?: {
        status?: number;
        errors?: Record<string, string[]>;
        meta?: Record<string, string>;
      };
    };
    customError.cause = {
      status,
      errors: error.response?.data?.errors,
      meta: error.response?.data?.meta,
    };

    return Promise.reject(customError);
  },
);

publicApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    unmarkLoading(response.config as LoadingConfig);
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    unmarkLoading(error.config as LoadingConfig);
    const status = error.response?.status;
    let message = error.message;

    if (status) {
      message = error.response?.data?.message || ERROR_MESSAGES[status] || "An error occurred";
    }

    console.error("publicApiClient: API request failed:", {
      status,
      message: error.response?.data?.message,
      errors: error.response?.data?.errors,
      url: error.config?.url,
    });

    const customError = new Error(message) as Error & {
      cause?: {
        status?: number;
        errors?: Record<string, string[]>;
        meta?: Record<string, string>;
      };
    };
    customError.cause = {
      status,
      errors: error.response?.data?.errors,
      meta: error.response?.data?.meta,
    };

    return Promise.reject(customError);
  },
);

export default apiClient;
export { fetchProfile, publicApiClient };
