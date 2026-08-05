/**
 * User profile query hook.
 * Provides typed query for fetching current user profile.
 */

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services";
import { AUTH_QUERY_KEYS } from "../query";
import { useAppDispatch } from "../../store/hooks";
import { setUserProfile } from "../../store/slices/authSlice";
import { UserProfile } from "../types";

/**
 * User profile query hook.
 * Fetches and stores the current user profile.
 */
export function useUserProfile(enabled: boolean = true) {
  const dispatch = useAppDispatch();

  const query = useQuery<UserProfile>({
    queryKey: AUTH_QUERY_KEYS.PROFILE(),
    queryFn: async (): Promise<UserProfile> => {
      const response = await getCurrentUser();
      return response;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Store user profile in Redux when data is fetched
  if (query.data) {
    dispatch(setUserProfile(query.data));
  }

  return query;
}


export default useUserProfile;