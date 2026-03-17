import type { ApiResponse } from "@/types/generals";
import { useToast } from "@/composables/useToast";
import { ref, readonly } from "vue";

interface ErrorDetail {
  status?: number;
  errors?: Record<string, string[]>;
  meta?: Record<string, string | number>;
  originalError?: Error;
}

interface ErrorDisplayOptions {
  showToast?: boolean;
  duration?: number;
  showDetails?: boolean;
}

/**
 * Provides unified error handling utilities for API responses and exceptions.
 * Handles error parsing, user messaging, toast notifications, and exposes last error state.
 */
export function useErrorHandler() {
  const { showErrorToast, showToast: showSimpleToast } = useToast();
  const lastError = ref<ErrorDetail | null>(null);

  /**
   * Converts a given error and error detail (status/meta) into a human-readable message for users.
   *
   * @param error - The error object thrown or returned by an operation
   * @param errorDetail - Optional error detail with status/meta properties
   * @returns Human-readable error message string.
   */
  const getHumanReadableMessage = (error: Error, errorDetail?: ErrorDetail): string => {
    const status = errorDetail?.status;
    const meta = errorDetail?.meta;

    if (meta?.error_code) {
      switch (meta.error_code) {
        case "VALIDATION_ERROR":
          return "Please check your input and correct any validation errors.";
        case "UNAUTHENTICATED":
          return "Your session has expired. Please log in again.";
        case "DATABASE_ERROR":
          return "A database error occurred. Please try again or contact support.";
        case "HTTP_ERROR":
          return getStatusMessage(status);
        case "SERVER_ERROR":
          return "An unexpected server error occurred. Please try again later.";
        default:
          return error.message || "An error occurred while processing your request.";
      }
    }

    if (status) {
      return getStatusMessage(status);
    }

    return error.message || "An unexpected error occurred.";
  };

  /**
   * Converts a given HTTP status code into a standardized user-friendly message.
   *
   * @param status - HTTP status code, e.g., 404, 422, 500, etc.
   * @returns Associated human-readable message.
   */
  const getStatusMessage = (status?: number): string => {
    if (!status) return "An unexpected error occurred.";

    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check your input and try again.",
      401: "You need to log in to access this resource.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource could not be found.",
      409: "This action conflicts with existing data. Please refresh and try again.",
      419: "Security token expired. Please refresh the page and try again.",
      422: "The provided data is invalid. Please check your input.",
      429: "Too many requests. Please wait a moment and try again.",
      500: "Server error. Please try again later or contact support.",
      502: "Service temporarily unavailable. Please try again later.",
      503: "Service temporarily unavailable. Please try again later.",
      504: "Request timeout. Please try again.",
    };

    return statusMessages[status] || `Request failed with status ${status}. Please try again.`;
  };

  /**
   * Handles an error instance: saves to state, shows optional toast, translates to human-readable message.
   *
   * @param error - An Error object (may contain extra `cause`)
   * @param options - Controls toast notification and duration
   */
  const handleError = (
    error: Error & { cause?: ErrorDetail },
    options: ErrorDisplayOptions = {
      showToast: true,
      duration: 4000,
    },
  ): void => {
    const errorDetail: ErrorDetail = {
      status: (error.cause as ErrorDetail)?.status,
      errors: (error.cause as ErrorDetail)?.errors,
      meta: (error.cause as ErrorDetail)?.meta,
      originalError: error,
    };

    lastError.value = errorDetail;

    const humanMessage = getHumanReadableMessage(error, errorDetail);
    const isValidationError =
      errorDetail.status === 422 || errorDetail.meta?.error_code === "VALIDATION_ERROR";

    if (options.showToast) {
      const toastTitle = isValidationError ? "Validation Error" : "Error";

      showErrorToast({
        title: toastTitle,
        message: humanMessage,
        status: errorDetail.status,
        validationErrors: isValidationError ? errorDetail.errors : undefined,
        duration: options.duration || 4000,
      });
    }
  };

  /**
   * Handles an API response: checks for errors, shows optional toasts, and returns data or throws.
   *
   * @param response - The ApiResponse to handle
   * @param successOnly - Throw if response is successful but missing data
   * @param errorOptions - Options for toast behavior on error
   * @param showToast - If true, will display a success toast on success
   * @returns The response's data, or throws on error.
   */
  const handleResponse = <T>(
    response: ApiResponse<T>,
    showToast: boolean = false,
    successOnly = false,
    errorOptions: ErrorDisplayOptions = { showToast: true },
  ): T => {
    if (!response) {
      const error = new Error("No response from server");
      handleError(error, errorOptions);
      throw error;
    }

    if (response.status === "error") {
      const error = new Error(response.message || "Request failed");
      (error as Error & { cause?: ErrorDetail }).cause = {
        status: 400,
        errors: response.errors as Record<string, string[]>,
        meta: (response as unknown as { meta?: Record<string, string | number> }).meta,
      };
      handleError(error, errorOptions);
      throw error;
    }

    if (!response.data) {
      if (successOnly) {
        const error = new Error("No data in success response");
        handleError(error, errorOptions);
        throw error;
      }

      if (showToast) {
        showSimpleToast(response.message || "Request completed successfully", "success");
      }

      return {} as T;
    }

    if (showToast) {
      showSimpleToast(response.message || "Request completed successfully", "success");
    }

    return response.data;
  };

  /**
   * Clears the last error stored in the handler.
   */
  const clearLastError = (): void => {
    lastError.value = null;
  };

  /**
   * Summarizes the last error, extracting a message, raw details, and validation info for UI display.
   *
   * @returns Info about the last error, or null if no error exists.
   */
  const getErrorSummary = (): {
    message: string;
    details: string;
    hasValidationErrors: boolean;
    validationErrors: Record<string, string[]>;
  } | null => {
    if (!lastError.value?.originalError) return null;

    const error = lastError.value.originalError;
    const errorDetail = lastError.value;

    const isValidationError =
      errorDetail.status === 422 || errorDetail.meta?.error_code === "VALIDATION_ERROR";

    return {
      message: getHumanReadableMessage(error, errorDetail),
      details: error.message,
      hasValidationErrors: isValidationError && !!errorDetail.errors,
      validationErrors: isValidationError && errorDetail.errors ? errorDetail.errors : {},
    };
  };

  return {
    handleError,
    handleResponse,
    clearLastError,
    getErrorSummary,
    lastError: readonly(lastError),
  };
}
