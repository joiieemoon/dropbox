/**
 * Authentication endpoints.
 * Centralizes all auth-related API endpoint paths.
 */

import { HttpMethod } from "../types";

/**
 * Authentication API endpoints.
 */
export const AUTH_ENDPOINTS = {
  LOGIN: {
    path: "/auth/login",
    method: HttpMethod.POST,
    requiresAuth: false,
  } as const,
  SIGNUP: {
    path: "/users/add",
    method: HttpMethod.POST,
    requiresAuth: false,
  } as const,
  REFRESH: {
    path: "/auth/refresh",
    method: HttpMethod.POST,
    requiresAuth: false,
  } as const,
  PROFILE: {
    path: "/auth/me",
    method: HttpMethod.GET,
    requiresAuth: true,
  } as const,
  LOGOUT: {
    path: "/auth/logout",
    method: HttpMethod.POST,
    requiresAuth: true,
  } as const,
};

export type AuthEndpoint = (typeof AUTH_ENDPOINTS)[keyof typeof AUTH_ENDPOINTS];