/**
 * Core API response types.
 * Provides generic, reusable types for all API responses.
 */

/**
 * Standard API response wrapper.
 * All successful API responses should conform to this structure.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/**
 * Normalized error structure.
 * Provides consistent error handling across the application.
 */
export interface  ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Pagination metadata.
 */
export interface ApiPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * API metadata for responses.
 */
export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
}

/**
 * Paginated API response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: ApiPagination;
  meta: ApiMeta;
}

/**
 * HTTP methods enum.
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

/**
 * Request configuration for API calls.
 */
export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
}

/**
 * API endpoint definition.
 */
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  requiresAuth?: boolean;
}