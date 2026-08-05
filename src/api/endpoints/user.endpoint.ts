/**
 * User endpoints.
 * Centralizes all user-related API endpoint paths.
 */

import { HttpMethod } from "../types";

/**
 * User API endpoints.
 */
export const USER_ENDPOINTS = {
  GET_ALL: {
    path: "/users/",
    method: HttpMethod.GET,
    requiresAuth: true,
  } as const,
  GET_BY_ID: {
    path: "/users/{id}",
    method: HttpMethod.GET,
    requiresAuth: true,
  } as const,
  CREATE: {
    path: "/users/",
    method: HttpMethod.POST,
    requiresAuth: true,
  } as const,
  UPDATE: {
    path: "/users/{id}",
    method: HttpMethod.PUT,
    requiresAuth: true,
  } as const,
  DELETE: {
    path: "/users/{id}",
    method: HttpMethod.DELETE,
    requiresAuth: true,
  } as const,
};

export type UserEndpoint = (typeof USER_ENDPOINTS)[keyof typeof USER_ENDPOINTS];