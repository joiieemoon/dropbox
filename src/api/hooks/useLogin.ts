/**
 * Login mutation hook.
 * Provides typed mutation for authentication login.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
 * Login mutation hook.
 * Handles authentication login with automatic token storage and Redux state update.
 */
export function useLogin(options?: UseLoginOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

      // Redirect on success
      if (options?.onSuccessRedirect) {
        navigate(options.onSuccessRedirect);
      }
    },
    onError: (error) => {
      options?.onError?.(error as NormalizedApiError);
    },
  });
}

export default useLogin;