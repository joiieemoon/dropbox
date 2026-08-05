/**
 * Public route component.
 * Renders children for unauthenticated users.
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { selectIsAuthenticated } from "../../../store/selectors";

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Resolve the redirect target, preferring the "from" location state
 * (set by ViewerGate or ProtectedRoute) so the user returns to the
 * page they were trying to access after authenticating.
 */
function resolveRedirect(from: unknown, fallback: string): string {
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
 * Public route - accessible only to unauthenticated users.
 * Redirects authenticated users back to their intended destination
 * (if provided via location state) or the specified default path.
 */
export function PublicRoute({
  children,
  redirectTo = "/dashboard",
}: PublicRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: unknown })?.from;
    const target = resolveRedirect(from, redirectTo);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

export default PublicRoute;
