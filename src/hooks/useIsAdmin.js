import { useAuth } from "@/lib/AuthContext";

/**
 * Returns true if the currently logged-in user has the "admin" role.
 * All create / update / delete actions should be gated behind this hook.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === "admin";
}