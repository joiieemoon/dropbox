/**
 * User data transformers.
 * Maps API responses to application types.
 */

import { User, CreateUserPayload, UpdateUserPayload } from "../types";

/**
 * Transform user API response.
 * Handles DummyJSON API response format.
 */
export function mapUser(response: Record<string, unknown>): User {
  return {
    id: response.id as number,
    email: response.email as string,
    username: response.username as string,
    name: response.name as string,
    role: response.role as string,
    avatar: (response.image as string) || (response.avatar as string),
    creationAt: response.creationAt as string,
  };
}

/**
 * Transform user array response.
 */
export function mapUsers(response: Record<string, unknown>[]): User[] {
  return response.map(mapUser);
}

/**
 * Transform create user payload.
 */
export function mapCreateUserPayload(
  payload: CreateUserPayload,
): CreateUserPayload {
  return {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    avatar: payload.avatar,
    role: payload.role,
  };
}

/**
 * Transform update user payload.
 */
export function mapUpdateUserPayload(
  payload: UpdateUserPayload,
): UpdateUserPayload {
  return {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    avatar: payload.avatar,
    role: payload.role,
  };
}