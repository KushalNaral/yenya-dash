export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  total?: number;
  count?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  from?: number | null;
  to?: number | null;
  search?: string;
}

export function createEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    data: [],
    meta: {
      current_page: 1,
      per_page: 15,
      total: 0,
      last_page: 1,
      from: null,
      to: null,
    },
    search: "",
  };
}
