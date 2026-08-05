/**
 * Authentication guard component.
 * Provides authentication context and loading state.
 */

import { ReactNode } from "react";
import { useAppSelector } from "../../../store/hooks";
import { selectAuthLoading } from "../../../store/selectors";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Auth guard - wraps components that require authentication.
 * Handles loading states and provides auth context.
 */
export function AuthGuard({
  children,
  fallback = <div>Loading...</div>,
}: AuthGuardProps) {
  const isLoading = useAppSelector(selectAuthLoading);

  // Future: Add token refresh logic here
  // useEffect(() => {
  //   if (isTokenExpired() && getRefreshToken()) {
  //     // Attempt token refresh
  //   }
  // }, [isAuthenticated]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default AuthGuard;