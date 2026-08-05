/**
 * Signup mutation hook.
 * Provides typed mutation for user registration.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signup, storeToken } from "../services";
import { SignupPayload, UserProfile } from "../types";
import { AUTH_MUTATION_KEYS, USER_QUERY_KEYS } from "../query";
import { mapSignupResponse } from "../transformers/auth.mapper";
import { setCredentials } from "../../store/slices/authSlice";

/**
 * Signup mutation options.
 */
interface UseSignupOptions {
  onSuccessRedirect?: string;
  onError?: (error: Error) => void;
  onSuccess?: (data: UserProfile) => void;
}

/**
 * Signup mutation hook.
 * Handles user registration with automatic token storage and Redux state update.
 */
export function useSignup(options?: UseSignupOptions) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: AUTH_MUTATION_KEYS.SIGNUP(),
    mutationFn: async (payload: SignupPayload): Promise<UserProfile> => {
      const response = await signup(payload);
      return mapSignupResponse(response);
    },
    onSuccess: (data) => {
      // Create a mock token pair for signup (API doesn't return tokens in signup)
      // In real API, signup would return tokens
      const accessToken = "mock-access-token"; // Would come from API
      const refreshToken = undefined;

      // Store tokens in localStorage
      storeToken(accessToken, refreshToken);

      // Update Redux state
      dispatch(
        setCredentials({
          user: data,
          tokens: {
            accessToken,
            refreshToken,
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
      options?.onError?.(error as Error);
    },
  });
}

export default useSignup;