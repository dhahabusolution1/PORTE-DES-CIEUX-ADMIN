import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  requiredRole?: Role;
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, accessToken, user, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    let expiresAt: number;
    try {
      const encodedPayload = accessToken?.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? '';
      const payload = JSON.parse(atob(encodedPayload)) as { exp?: number };
      if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
        clearAuth();
        return;
      }
      expiresAt = payload.exp * 1000;
    } catch {
      clearAuth();
      return;
    }

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      clearAuth();
      return;
    }

    const timeout = window.setTimeout(clearAuth, Math.min(remaining, 2_147_483_647));
    return () => window.clearTimeout(timeout);
  }, [isAuthenticated, accessToken, clearAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-base font-semibold text-accent-900">Accès refusé</p>
        <p className="text-xs text-accent-500">
          Cette section est réservée aux {requiredRole.replace('_', ' ').toLowerCase()}s.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
