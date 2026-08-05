/**
 * Update profile mutation hook.
 * Provides typed mutation for updating user profile.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "../services";
import { AUTH_QUERY_KEYS } from "../query";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setUserProfile } from "../../store/slices/authSlice";
import { selectUser } from "../../store/selectors";
import { toastSuccess, toastError } from "../../components/common/toast";
import { UserProfile } from "../types";

/**
 * Update profile mutation options.
 */
interface UseUpdateProfileOptions {
  onSuccess?: (data: UserProfile) => void;
  onError?: (error: Error) => void;
}

/**
 * Update profile mutation hook.
 */
export function useUpdateProfile(options?: UseUpdateProfileOptions) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.PROFILE(),
    mutationFn: async (payload: Partial<UserProfile>): Promise<UserProfile> => {
      const response = await updateUserProfile(payload, user?.id);
      return response;
    },
    onSuccess: (data) => {
      // Update Redux state
      dispatch(setUserProfile(data));

      // Invalidate profile queries
      queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEYS.PROFILE(),
      });

      // Show success toast
      toastSuccess("Profile updated successfully!");

      // Call custom success handler
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      // Show error toast
      toastError("Failed to update profile. Please try again.");

      // Call custom error handler
      options?.onError?.(error as Error);
    },
  });
}

export default useUpdateProfile;