/**
 * Authentication types.
 * Defines all types related to authentication flows.
 */

import { ApiResponse } from "./api.types";

/**
 * Login request payload.
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login response from API.
 * The API returns user data at the top level along with tokens.
 */
export interface LoginResponse {
  // camelCase (actual API format)
  accessToken: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  // Firebase UID (the secure, stable identity for this app)
  firebaseUid?: string;
  // snake_case (for compatibility)
  access_token?: string;
  refresh_token?: string;
}

/**
 * Signup request payload.
 */
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role?: string;
}

/**
 * Signup response from API.
 */
export interface SignupResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar: string;
  creationAt: string;
  // Firebase UID (the secure, stable identity for this app)
  firebaseUid?: string;
}

/**
 * User profile from API.
 */
export interface UserProfile {
  [key: string]: unknown;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  name: string;
  creationAt?: string;
  // Firebase UID (the secure, stable identity for this app)
  firebaseUid?: string;
  // Additional fields from /auth/me endpoint
  phone?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Authentication state stored in Redux.
 */
export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Role type for future role-based access.
 */
export type UserRole = "admin" | "customer" | "seller" | string;

/**
 * Token pair for authentication.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  user?: UserProfile | null;
}

/**
 * API response for login.
 */
export type LoginApiResponse = ApiResponse<LoginResponse>;

/**
 * API response for signup.
 */
export type SignupApiResponse = ApiResponse<SignupResponse>;