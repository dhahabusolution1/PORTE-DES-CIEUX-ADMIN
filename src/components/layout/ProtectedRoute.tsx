import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  requiredRole?: Role;
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

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
