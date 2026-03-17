import apiClient from "@/api";
import type { ApiResponse } from "@/types/generals";
import { type PaginatedResponse } from "@/types/pagination/pagination";
import type { StatusUpdate as StatusUpdateData } from "@/types/generals/statusUpdate";
import type { StatusUpdate as VerificationUpdateData } from "@/types/generals/verificationUpdate";
import { useErrorHandler } from "@/composables/useErrorHandler";

const { handleError, handleResponse } = useErrorHandler();

/**
 * Checks if an object contains any File or Blob instances.
 */
function hasFiles(obj: any): boolean {
  if (obj instanceof File || obj instanceof Blob) return true;
  if (Array.isArray(obj)) return obj.some(hasFiles);
  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj).some(hasFiles);
  }
  return false;
}

/**
 * Recursively converts an object to FormData.
 */
function objectToFormData(
  obj: any,
  formData: FormData = new FormData(),
  parentKey: string = "",
) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const propertyKey = parentKey ? `${parentKey}[${key}]` : key;

      if (value instanceof File || value instanceof Blob) {
        formData.append(propertyKey, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayKey = `${propertyKey}[${index}]`;
          if (item instanceof File || item instanceof Blob) {
            formData.append(arrayKey, item);
          } else if (typeof item === "object" && item !== null) {
            objectToFormData(item, formData, arrayKey);
          } else {
            formData.append(arrayKey, item === null ? "" : item);
          }
        });
      } else if (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof Date)
      ) {
        objectToFormData(value, formData, propertyKey);
      } else {
        formData.append(propertyKey, value === null ? "" : value);
      }
    }
  }
  return formData;
}

/**
 * Generic BaseService for handling CRUD operations.
 *
 * Provides reusable methods for list, getAll, getById, create, update, delete, and changeStatus.
 * Designed to be used with specific entity services (e.g., YearService).
 *
 * @param endpoint The API endpoint prefix (e.g., 'years' for '/v1/years').
 * @returns An object with CRUD methods.
 *
 * Example:
 * const yearService = createBaseService('years');
 * yearService.list({ status: 'active' }).then(data => console.log(data));
 */
export function createBaseService<T, C, U>(endpoint: string) {
  return {
    /**
     * Retrieves a paginated list of records.
     *
     * @param params Query parameters for filtering, sorting, etc.
     * @returns PaginatedResponse<T>
     */
    async list(
      params: Record<string, any> = {},
    ): Promise<PaginatedResponse<T>> {
      try {
        const res = await apiClient.get<ApiResponse<T[]>>(`${endpoint}`, {
          params,
        });

        handleResponse(res.data, false, false, { showToast: false });
        console.log(res.data, "from baseService");
        return res.data as PaginatedResponse<T>;
      } catch (error: any) {
        handleError(error, {
          showToast: false,
          showDetails: false,
          duration: 3000,
        });
        throw error;
      }
    },

    /**
     * Retrieves all records.
     *
     * @returns T[]
     */
    async getAll(): Promise<T[]> {
      try {
        const res = await apiClient.get<ApiResponse<T[]>>(`${endpoint}/all`);
        return handleResponse(res.data);
      } catch (error: any) {
        handleError(error, {
          showToast: false,
          showDetails: false,
          duration: 3000,
        });
        throw error;
      }
    },

    /**
     * Retrieves a record by ID.
     *
     * @param id The record ID.
     * @returns T
     */
    async getById(id: number): Promise<T> {
      try {
        const res = await apiClient.get<ApiResponse<T>>(`${endpoint}/${id}`);
        return handleResponse(res.data);
      } catch (error: any) {
        handleError(error, {
          showToast: false,
          showDetails: false,
          duration: 3000,
        });
        throw error;
      }
    },

    /**
     * Creates a new record.
     *
     * @param data The data to create the record (DTO).
     * @returns T
     */
    async create(data: C): Promise<T> {
      try {
        let payload: any = data;
        let config = {};

        if (hasFiles(data)) {
          payload = objectToFormData(data);
          config = { headers: { "Content-Type": "multipart/form-data" } };
        }

        const res = await apiClient.post<ApiResponse<T>>(
          `${endpoint}`,
          payload,
          config,
        );
        return handleResponse(res.data, false, false, { showToast: true });
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Updates an existing record.
     *
     * @param id The record ID.
     * @param data The data to update the record (DTO).
     * @returns T
     */
    async update(id: number, data: U): Promise<T> {
      try {
        let payload: any = data;
        let config = {};

        if (hasFiles(data)) {
          payload = objectToFormData(data);
          config = { headers: { "Content-Type": "multipart/form-data" } };
        }

        const res = await apiClient.patch<ApiResponse<T>>(
          `${endpoint}/${id}`,
          payload,
          config,
        );
        return handleResponse(res.data, false, false, { showToast: true });
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Deletes a record.
     *
     * @param id The record ID.
     * @returns void
     */
    async delete(id: number): Promise<void> {
      try {
        const res = await apiClient.delete<ApiResponse<void>>(
          `${endpoint}/${id}`,
        );
        handleResponse(res.data, false, false, { showToast: true });
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Changes the status of a record.
     *
     * @param id The record ID.
     * @param data The status update data.
     * @returns T
     */
    async changeStatus(id: number, data: StatusUpdateData): Promise<void> {
      console.log(data, "from baseService");
      try {
        const res = await apiClient.patch<ApiResponse<void>>(
          `${endpoint}/${id}/status`,
          data,
        );
        handleResponse(res.data, false, false, { showToast: true });
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Updates the verification status of a record.
     *
     * @param id The record ID.
     * @param data The verification update data.
     * @returns void
     */
    async updateVerificationStatus(
      id: number,
      data: VerificationUpdateData,
    ): Promise<void> {
      try {
        const res = await apiClient.patch<ApiResponse<void>>(
          `${endpoint}/${id}/verify`,
          data,
        );
        handleResponse(res.data, false, false, { showToast: true });
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Uploads an Excel file for importing records.
     *
     * NOTE: Your backend should handle route: POST v1/{endpoint}/import-excel
     *
     * @param formData FormData containing the Excel file
     * @returns any (adjust if backend returns specific DTO)
     */
    async uploadExcel(data: FormData): Promise<void> {
      try {
        const res = await apiClient.post<ApiResponse<void>>(
          `${endpoint}/import`,
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        handleResponse(res.data, false, false, { showToast: true });
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Exports data to Excel for the given endpoint.
     *
     * @param params Optional query parameters (e.g., filters)
     * @returns Blob (Excel file)
     */
    async exportExcel(params: Record<string, any> = {}): Promise<void> {
      try {
        const res = await apiClient.get(`${endpoint}/export`, {
          params,
          responseType: "blob",
        });

        // Create a temporary URL and trigger download
        const blob = new Blob([res.data], { type: res.data.type });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${endpoint}_export_${new Date().toISOString()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        globalThis.URL.revokeObjectURL(url);
        a.remove();
      } catch (error: any) {
        handleError(error, {
          showToast: true,
          showDetails: true,
          duration: 5000,
        });
        throw error;
      }
    },

    /**
     * Fetch static types from a custom sub-endpoint like 'types' or 'ownerships'
     * @param subEndpoint e.g., 'types', 'ownerships'
     */
    async getDropdown(
      subEndpoint: string,
    ): Promise<{ value: string | number; label: string }[]> {
      try {
        const res = await apiClient.get<
          ApiResponse<{ value: string | number; label: string }[]>
        >(`${endpoint}/${subEndpoint}`);
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

    /**
     * Reorders records by updating their order values.
     *
     * @param items Array of {id, order} pairs
     * @returns void
     */
    async reorder(
      items: { id: number | string; order: number }[],
    ): Promise<void> {
      try {
        const res = await apiClient.post<ApiResponse<void>>(
          `${endpoint}/reorder`,
          { items },
        );
        handleResponse(res.data, false, false, { showToast: true });
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
}
