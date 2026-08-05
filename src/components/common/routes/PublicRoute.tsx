/**
 * Public route component.
 * Renders children for unauthenticated users.
 */

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { selectIsAuthenticated } from "../../../store/selectors";

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Public route - accessible only to unauthenticated users.
 * Redirects authenticated users to the specified path.
 */
export function PublicRoute({
  children,
  redirectTo = "/dashboard",
}: PublicRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default PublicRoute;