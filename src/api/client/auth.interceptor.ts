/**
 * Authentication interceptor.
 * Injects authorization header with Bearer token.
 */

import { InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { getToken, getRefreshToken } from "../auth.storage";

/**
 * Request interceptor for authentication.
 * Adds Bearer token to request headers.
 */
export function authRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = getToken();
  const refreshToken = getRefreshToken();

  if (token || refreshToken) {
    config.headers = new AxiosHeaders(config.headers);
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    
    }
    if (refreshToken) {
      config.headers.set("X-Refresh-Token", refreshToken);
    }
  }

  return config;
}

/**
 * Response interceptor for token refresh.
 * Handles 401 errors and token refresh (future-ready).
 */
export function authResponseInterceptor(
  error: { response?: { status: number } },
): { response?: { status: number } } {
  // Future: Implement token refresh logic here
  // if (error.response?.status === 401) {
  //   const refreshToken = getRefreshToken();
  //   if (refreshToken) {
  //     // Attempt token refresh
  //   }
  // }
  return error;
}