/**
 * Authentication configuration.
 * Centralizes all auth-related settings and feature flags.
 */

export const AUTH_CONFIG = {
  tokenKey: import.meta.env.VITE_TOKEN_KEY || "access_token",
  refreshTokenKey: import.meta.env.VITE_REFRESH_TOKEN_KEY || "refresh_token",
  tokenExpiryKey: import.meta.env.VITE_TOKEN_EXPIRY_KEY || "token_expiry",
  enableRefreshToken: import.meta.env.VITE_ENABLE_REFRESH_TOKEN === "true",
  enableRoleBasedAccess: import.meta.env.VITE_ENABLE_ROLE_BASED_ACCESS === "true",
} as const;

export type AuthConfig = typeof AUTH_CONFIG;