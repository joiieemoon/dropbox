/**
 * Error interceptor.
 * Normalizes API errors into consistent structure.
 */

import { AxiosError, AxiosResponse } from "axios";
import { ApiError } from "../types";

/**
 * HTTP status code constants.
 */
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error code constants.
 */
const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * Create normalized error from Axios error.
 */
function createApiError(error: AxiosError): ApiError {
  const timestamp = new Date().toISOString();

  if (!error.response) {
    return {
      code: error.code || ERROR_CODES.NETWORK_ERROR,
      message: error.message || "Network error occurred",
      status: 0,
      timestamp,
    };
  }

  const { status, data } = error.response;
  const details = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : undefined;

  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Authentication required. Please log in.",
        status,
        details,
        timestamp,
      };
    case HTTP_STATUS.FORBIDDEN:
      return {
        code: ERROR_CODES.FORBIDDEN,
        message: "You do not have permission to access this resource.",
        status,
        details,
        timestamp,
      };
    case HTTP_STATUS.NOT_FOUND:
      return {
        code: ERROR_CODES.NOT_FOUND,
        message: "The requested resource was not found.",
        status,
        details,
        timestamp,
      };
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return {
        code: ERROR_CODES.SERVER_ERROR,
        message: "Server error. Please try again later.",
        status,
        details,
        timestamp,
      };
    default:
      return {
        code: ERROR_CODES.UNKNOWN,
        message: (data as { message?: string })?.message || "An unexpected error occurred",
        status,
        details,
        timestamp,
      };
  }
}

/**
 * Response interceptor for error handling.
 * Transforms error responses into normalized ApiError format.
 */
export function errorResponseInterceptor(
  error: AxiosError,
): Promise<AxiosError> {
  const normalizedError = createApiError(error);
  return Promise.reject({
    ...error,
    normalizedError,
  });
}

/**
 * Request interceptor for error handling.
 * Can be used for request validation.
 */
export function errorRequestInterceptor(
  config: AxiosResponse,
): AxiosResponse {
  return config;
}