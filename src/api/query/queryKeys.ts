/**
 * Centralized query keys.
 * Provides consistent, type-safe query key management.
 */

import { UserQueryParams } from "../types";

/**
 * Query key factory for authentication.
 */
export const AUTH_QUERY_KEYS = {
  ALL: ["auth"] as const,
  LOGIN: (payload: { email: string }) =>
    [...AUTH_QUERY_KEYS.ALL, "login", payload.email] as const,
  PROFILE: () => [...AUTH_QUERY_KEYS.ALL, "profile"] as const,
  REFRESH: () => [...AUTH_QUERY_KEYS.ALL, "refresh"] as const,
} as const;

/**
 * Query key factory for users.
 */
export const USER_QUERY_KEYS = {
  ALL: ["users"] as const,
  LISTS: () => [...USER_QUERY_KEYS.ALL, "list"] as const,
  LIST: (filters?: UserQueryParams) =>
    [...USER_QUERY_KEYS.LISTS(), filters] as const,
  DETAILS: () => [...USER_QUERY_KEYS.ALL, "detail"] as const,
  DETAIL: (id: number) => [...USER_QUERY_KEYS.DETAILS(), id] as const,
} as const;

/**
 * Query key factory for profile.
 */
export const PROFILE_QUERY_KEYS = {
  ALL: ["profile"] as const,
  CURRENT: () => [...PROFILE_QUERY_KEYS.ALL, "current"] as const,
} as const;

/**
 * Query key factory for roles.
 */
export const ROLE_QUERY_KEYS = {
  ALL: ["roles"] as const,
  LIST: () => [...ROLE_QUERY_KEYS.ALL, "list"] as const,
} as const;