import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, accessToken, clearAuth } = useAuthStore();
  return { user, isAuthenticated, accessToken, logout: clearAuth };
}
