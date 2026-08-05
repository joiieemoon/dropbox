/**
 * Application configuration.
 * Centralizes all app-level settings and feature flags.
 */

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || "ReactKit",
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  env: import.meta.env.VITE_NODE_ENV || "development",
  isDevelopment: import.meta.env.VITE_NODE_ENV === "development",
  isProduction: import.meta.env.VITE_NODE_ENV === "production",
} as const;

export type AppConfig = typeof APP_CONFIG;