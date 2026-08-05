/**
 * User types.
 * Defines all types related to user management.
 */

import { ApiResponse, PaginatedResponse } from "./api.types";

/**
 * User entity from API.
 */
export interface User {
  [key: string]: unknown;
  id: number;
  email: string;
  username?: string;
  password?: string;
  name: string;
  role: string;
  avatar: string;
  image?: string;
  creationAt: string;
}

/**
 * User creation payload.
 */
export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role?: string;
}

/**
 * User update payload.
 */
export interface UpdateUserPayload {
  email?: string;
  password?: string;
  name?: string;
  avatar?: string;
  role?: string;
}

/**
 * API response for single user.
 */
export type UserApiResponse = ApiResponse<User>;

/**
 * API response for multiple users.
 */
export type UsersApiResponse = PaginatedResponse<User>;

/**
 * User query parameters.
 */
export interface UserQueryParams {
  offset?: number;
  limit?: number;
  role?: string;
}