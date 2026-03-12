import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";
import type { ReactElement } from "react";

const DEV_BYPASS = import.meta.env.DEV;

export function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (DEV_BYPASS) return children;

  if (isInitializing) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}
