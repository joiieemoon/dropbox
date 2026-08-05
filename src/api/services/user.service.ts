/**
 * User service.
 * Handles all user-related API calls.
 */

import { axiosInstance } from "../client/axios";
import { USER_ENDPOINTS } from "../endpoints";
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
} from "../types";
import { mapUser, mapUsers } from "../transformers/user.mapper";

/**
 * Get all users with optional query parameters.
 * Supports DummyJSON API format: limit, skip, select, filter
 */
export async function getUsers(
  params?: UserQueryParams,
): Promise<{ users: User[]; total: number; skip: number; limit: number }> {
  const queryParams: Record<string, string | number> = {};

  if (params?.limit !== undefined) queryParams.limit = params.limit;
  if (params?.offset !== undefined) queryParams.skip = params.offset;

  const response = await axiosInstance.get<{
    users: User[];
    total: number;
    skip: number;
    limit: number;
  }>(USER_ENDPOINTS.GET_ALL.path, { params: queryParams });
  return {
    users: mapUsers(response.data.users),
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
}

/**
 * Get users filtered by a key-value pair.
 * Example: /users/filter?key=hair.color&value=Brown
 */
export async function filterUsers(
  key: string,
  value: string,
  limit?: number,
  skip?: number,
): Promise<{ users: User[]; total: number; skip: number; limit: number }> {
  const response = await axiosInstance.get<{
    users: User[];
    total: number;
    skip: number;
    limit: number;
  }>(`/users/filter`, {
    params: { key, value, limit, skip },
  });
  return {
    users: mapUsers(response.data.users),
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
}

/**
 * Get user by ID.
 */
export async function getUserById(id: number): Promise<User> {
  const path = USER_ENDPOINTS.GET_BY_ID.path.replace("{id}", String(id));
  const response = await axiosInstance.get<User>(path);
  return mapUser(response.data);
}

/**
 * Create a new user.
 */
export async function createUser(
  payload: CreateUserPayload,
): Promise<User> {
  const response = await axiosInstance.post<User>(
    USER_ENDPOINTS.CREATE.path,
    payload,
  );
  return mapUser(response.data);
}

/**
 * Update an existing user.
 */
export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const path = USER_ENDPOINTS.UPDATE.path.replace("{id}", String(id));
  const response = await axiosInstance.put<User>(path, payload);
  return mapUser(response.data);
}

/**
 * Delete a user.
 */
export async function deleteUser(id: number): Promise<void> {
  const path = USER_ENDPOINTS.DELETE.path.replace("{id}", String(id));
  await axiosInstance.delete(path);
}