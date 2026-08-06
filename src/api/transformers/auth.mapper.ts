/**
 * Authentication data transformers.
 * Maps API responses to application types.
 */

import { LoginResponse, SignupResponse, UserProfile, TokenPair } from "../types";

/**
 * Transform login API response to token pair.
 * Handles both snake_case and camelCase API response formats.
 * The API returns user data at the top level along with tokens.
 */
export function mapLoginResponse(
  response: LoginResponse,
): TokenPair {
  return {
    accessToken: response.accessToken || response.access_token || "",
    refreshToken: response.refreshToken || response.refresh_token,
    user: {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      username: response.username,
      image: response.image,
      creationAt: "",
      firebaseUid: response.firebaseUid,
    },
  };
}

/**
 * Transform signup API response to user profile.
 */
export function mapSignupResponse(
  response: SignupResponse,
): UserProfile {
  return {
    id: response.id,
    email: response.email,
    firstName: response.name,
    lastName: "",
    username: "",
    image: response.avatar,
    creationAt: response.creationAt,
    firebaseUid: response.firebaseUid,
  };
}

/**
 * Transform user profile API response.
 */
export function mapUserProfile(
  response: UserProfile,
): UserProfile {
  return {
    id: response.id,
    email: response.email,
    firstName: response.firstName,
    lastName: response.lastName,
    username: response.username,
    image: response.image,
    creationAt: response.creationAt,
    firebaseUid: response.firebaseUid,
  };
}
