/**
 * Authentication service.
 * Handles all authentication-related API calls.
 */

import { axiosInstance } from "../client/axios";
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from "../endpoints";
import {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
  UserProfile,
} from "../types";
import {
  setToken,
  setRefreshToken,
  removeToken,
  removeRefreshToken,
  clearAuth,
} from "../auth.storage";

/**
 * Login with email and password.
 */
export async function login(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>(
    AUTH_ENDPOINTS.LOGIN.path,
    payload,
  );
  return response.data;
}

/**
 * Signup with user details.
 */
export async function signup(
  payload: SignupPayload,
): Promise<SignupResponse> {
  const response = await axiosInstance.post<SignupResponse>(
    AUTH_ENDPOINTS.SIGNUP.path,
    payload,
  );
  return response.data;
}

/**
 * Get current user profile.
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await axiosInstance.get<UserProfile>(
    AUTH_ENDPOINTS.PROFILE.path,
  );
  return response.data;
}

/**
 * Update user profile.
 * Uses the user ID from the profile to update via /users/{id} endpoint.
 */
export async function updateUserProfile(
  payload: Partial<UserProfile>,
  userId?: number,
): Promise<UserProfile> {
  const id = userId || payload.id;
  if (!id) {
    throw new Error("User ID is required to update profile");
  }
  const path = USER_ENDPOINTS.UPDATE.path.replace("{id}", String(id));
  const response = await axiosInstance.put<UserProfile>(path, payload);
  return response.data;
}

/**
 * Logout user.
 */
export async function logout(): Promise<void> {
  try {
    await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT.path);
  } catch {
    // Ignore logout errors - still clear local state
  } finally {
    clearAuth();
  }
}

/**
 * Store authentication tokens.
 */
export function storeToken(
  accessToken: string,
  refreshToken?: string,
): void {
  setToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

/**
 * Remove authentication tokens.
 */
export function removeTokens(): void {
  removeToken();
  removeRefreshToken();
}

/**
 * Refresh access token (future-ready).
 */
export async function refreshToken(): Promise<LoginResponse | null> {
  // Future implementation for token refresh
  return null;
}