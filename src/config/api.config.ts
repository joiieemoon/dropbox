/**
 * API configuration.
 * Centralizes all API-related settings.
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "https://dummyjson.com",
  timeout: 30000,
  logging: import.meta.env.VITE_API_LOGGING === "true",
} as const;

export type ApiConfig = typeof API_CONFIG;