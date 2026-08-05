/**
 * Main interceptor setup.
 * Configures and applies all interceptors to axios instance.
 */

import { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { axiosInstance } from "./axios";
import { authRequestInterceptor } from "./auth.interceptor";
import { errorResponseInterceptor } from "./error.interceptor";
import { API_CONFIG } from "../../config/api.config";

/**
 * Request logging in development mode.
 */
function requestLogger(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (API_CONFIG.logging) {
    console.log("[API Request]", {
      method: config.method,
      url: config.url,
      data: config.data,
    });
  }
  return config;
}

/**
 * Response logging in development mode.
 */
function responseLogger(response: AxiosResponse): AxiosResponse {
  if (API_CONFIG.logging) {
    console.log("[API Response]", {
      status: response.status,
      data: response.data,
    });
  }
  return response;
}

/**
 * Setup all interceptors on axios instance.
 */
export function setupInterceptors(): void {
  // Request interceptors
  axiosInstance.interceptors.request.use(
    (config) => {
      const loggedConfig = requestLogger(config);
      return authRequestInterceptor(loggedConfig);
    },
    (error) => Promise.reject(error),
  );

  // Response interceptors
  axiosInstance.interceptors.response.use(
    (response) => {
      return responseLogger(response);
    },
    (error) => {
      return errorResponseInterceptor(error);
    },
  );
}

// Auto-setup interceptors when module is imported
setupInterceptors();