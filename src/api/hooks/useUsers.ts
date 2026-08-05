/**
 * Users query hook.
 * Provides typed query for fetching users with pagination and filtering.
 */

import { useQuery } from "@tanstack/react-query";
import { getUsers, filterUsers } from "../services";
import { USER_QUERY_KEYS } from "../query";
import { UserQueryParams } from "../types";

/**
 * Users query hook.
 * Fetches users with optional pagination and filtering.
 * Supports DummyJSON API format: limit, skip, select, filter
 */
export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.LIST(params),
    queryFn: async () => {
      const response = await getUsers(params);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Filtered users query hook.
 * Fetches users filtered by a key-value pair.
 * Example: filterUsers("hair.color", "Brown")
 */
export function useFilterUsers(
  key: string,
  value: string,
  limit?: number,
  skip?: number,
) {
  return useQuery({
    queryKey: [...USER_QUERY_KEYS.ALL, "filter", key, value, limit, skip] as const,
    queryFn: async () => {
      const response = await filterUsers(key, value, limit, skip);
      return response;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export default useUsers;