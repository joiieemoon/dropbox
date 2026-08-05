/**
 * Logout mutation hook.
 * Provides typed mutation for user logout.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout as logoutApi, removeTokens } from "../services";
import { AUTH_MUTATION_KEYS, USER_QUERY_KEYS } from "../query";
import { logout as logoutAction } from "../../store/slices/authSlice";

/**
 * Logout mutation options.
 */
interface UseLogoutOptions {
  onSuccessRedirect?: string;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Logout mutation hook.
 * Handles user logout with token cleanup and Redux state update.
 */
export function useLogout(options?: UseLogoutOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return useMutation({
    mutationKey: AUTH_MUTATION_KEYS.LOGOUT(),
    mutationFn: async (): Promise<void> => {
      await logoutApi();
    },
    onSuccess: () => {
      // Remove tokens from localStorage
      removeTokens();

      // Clear Redux state
      dispatch(logoutAction());

      // Invalidate user queries
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.ALL,
      });

      // Call custom success handler
      options?.onSuccess?.();

      // Redirect on success
      if (options?.onSuccessRedirect) {
        navigate(options.onSuccessRedirect);
      }
    },
    onError: (error) => {
      // Still clear local state on error
      removeTokens();
      dispatch(logoutAction());
      options?.onError?.(error as Error);
    },
  });
}

export default useLogout;