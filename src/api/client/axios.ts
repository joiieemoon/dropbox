  /**
 * Axios instance configuration.
 * Creates a reusable, configured axios instance for API calls.
 */

import axios from "axios";
import { API_CONFIG } from "../../config/api.config";

/**
 * Create axios instance with default configuration.
 */
export const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request cancellation utility.
 * Creates an abort controller for request cancellation.
 */
export function createAbortController(): AbortController {
  return new AbortController();
}

/**
 * Cancel all pending requests.
 * Useful for cleanup on component unmount.
 */
export function cancelAllRequests(controllers: AbortController[]): void {
  controllers.forEach((controller) => controller.abort());
}

export default axiosInstance;