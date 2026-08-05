/**
 * Guest route component.
 * Renders children for guest users (not authenticated).
 * Alias for PublicRoute for semantic clarity.
 */

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { selectIsAuthenticated } from "../../../store/selectors";

interface GuestRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Guest route - accessible only to unauthenticated users.
 * Redirects authenticated users to the specified path.
 */
export function GuestRoute({
  children,
  redirectTo = "/dashboard",
}: GuestRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default GuestRoute;