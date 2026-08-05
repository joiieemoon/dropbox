/**
 * Authentication storage utility.
 * Provides type-safe token management with expiration support.
 */

import { AUTH_CONFIG } from "../config/auth.config";

/**
 * Set access token in storage.
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_CONFIG.tokenKey, token);
}

/**
 * Get access token from storage.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_CONFIG.tokenKey);
}

/**
 * Set refresh token in storage.
 */
export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_CONFIG.refreshTokenKey, token);
}

/**
 * Get refresh token from storage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_CONFIG.refreshTokenKey);
}

/**
 * Remove access token from storage.
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
}

/**
 * Remove refresh token from storage.
 */
export function removeRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
}

/**
 * Clear all authentication data from storage.
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  removeToken();
  removeRefreshToken();
  localStorage.removeItem(AUTH_CONFIG.tokenExpiryKey);
}

/**
 * Set token with expiration.
 */
export function setTokenWithExpiry(
  token: string,
  expiresIn: number,
): void {
  if (typeof window === "undefined") return;
  setToken(token);
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(AUTH_CONFIG.tokenExpiryKey, String(expiryTime));
}

/**
 * Check if token is expired.
 */
export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  const expiryTime = localStorage.getItem(AUTH_CONFIG.tokenExpiryKey);
  if (!expiryTime) return true;
  return Date.now() > Number(expiryTime);
}

/**
 * Get valid token (not expired).
 */
export function getValidToken(): string | null {
  if (isTokenExpired()) {
    clearAuth();
    return null;
  }
  return getToken();
}