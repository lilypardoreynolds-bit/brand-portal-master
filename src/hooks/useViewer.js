import { useAuth } from "@/lib/AuthContext";
import { isViewerOnly } from "@/lib/permissions";

/**
 * Returns true if the current user is a viewer (read-only access).
 * Use this to hide/disable edit, create, and delete buttons.
 *
 * Usage:
 *   const isViewer = useViewer();
 *   <Button disabled={isViewer}>Edit</Button>
 *   {!isViewer && <Button>Delete</Button>}
 */
export function useViewer() {
  const { user } = useAuth();
  return isViewerOnly(user);
}