/**
 * Centralized mutation keys.
 * Provides consistent, type-safe mutation key management.
 */

/**
 * Mutation key factory for authentication.
 */
export const AUTH_MUTATION_KEYS = {
  ALL: ["auth"] as const,
  LOGIN: () => [...AUTH_MUTATION_KEYS.ALL, "login"] as const,
  SIGNUP: () => [...AUTH_MUTATION_KEYS.ALL, "signup"] as const,
  LOGOUT: () => [...AUTH_MUTATION_KEYS.ALL, "logout"] as const,
  REFRESH: () => [...AUTH_MUTATION_KEYS.ALL, "refresh"] as const,
} as const;

/**
 * Mutation key factory for users.
 */
export const USER_MUTATION_KEYS = {
  ALL: ["users"] as const,
  CREATE: () => [...USER_MUTATION_KEYS.ALL, "create"] as const,
  UPDATE: () => [...USER_MUTATION_KEYS.ALL, "update"] as const,
  DELETE: () => [...USER_MUTATION_KEYS.ALL, "delete"] as const,
} as const;