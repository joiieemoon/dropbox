/**
 * Login mutation hook.
 * Provides typed mutation for authentication login.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, storeToken } from "../services";
import { ApiError, LoginPayload, TokenPair } from "../types";
import { AUTH_MUTATION_KEYS, USER_QUERY_KEYS } from "../query";
import { mapLoginResponse } from "../transformers/auth.mapper";
import { setCredentials } from "../../store/slices/authSlice";

/**
 * Login mutation options.
 */
/**
 * Error type augmented with normalized error info from the error interceptor.
 */
export type NormalizedApiError = Error & { normalizedError?: ApiError };

interface UseLoginOptions {
  onSuccessRedirect?: string;
  onError?: (error: NormalizedApiError) => void;
  onSuccess?: (data: TokenPair) => void;
}

/**
 * Resolve the post-login redirect target.
 * Accepts either a string path or a Location object (from ProtectedRoute),
 * falling back to the provided default redirect.
 */
function resolveRedirectTarget(
  from: unknown,
  fallback?: string,
): string | undefined {
  if (typeof from === "string" && from) {
    return from;
  }
  if (from && typeof from === "object") {
    const loc = from as { pathname?: string; search?: string; hash?: string };
    if (loc.pathname) {
      return `${loc.pathname}${loc.search ?? ""}${loc.hash ?? ""}`;
    }
  }
  return fallback;
}

/**
 * Login mutation hook.
 * Handles authentication login with automatic token storage and Redux state update.
 */
export function useLogin(options?: UseLoginOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  return useMutation({
    mutationKey: AUTH_MUTATION_KEYS.LOGIN(),
    mutationFn: async (payload: LoginPayload): Promise<TokenPair> => {
      const response = await login(payload);
      return mapLoginResponse(response);
    },
    onSuccess: (data) => {
      // Store tokens in localStorage
      storeToken(data.accessToken, data.refreshToken);

      // Update Redux state
      dispatch(
        setCredentials({
          user: data.user ?? null,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
        }),
      );

      // Invalidate user queries
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.ALL,
      });

      // Call custom success handler
      options?.onSuccess?.(data);

      // Redirect on success — prefer the "from" state (e.g. from ViewerGate
      // or ProtectedRoute) so the user returns to the page they were trying
      // to access. The "from" value may be a string path or a Location object.
      const from = (location.state as { from?: unknown })?.from;
      const target = resolveRedirectTarget(from, options?.onSuccessRedirect);
      if (target) {
        navigate(target);
      }
    },
    onError: (error) => {
      options?.onError?.(error as NormalizedApiError);
    },
  });
}

export default useLogin;