export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: PaginationMeta | null;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  meta: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}
