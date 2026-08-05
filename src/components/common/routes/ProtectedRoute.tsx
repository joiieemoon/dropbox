/**
 * Protected route component.
 * Renders children only for authenticated users.
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { selectIsAuthenticated } from "../../../store/selectors";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Protected route - accessible only to authenticated users.
 * Redirects unauthenticated users to the specified path.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/signin",
}: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();
  console.log(isAuthenticated, "auth");
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
