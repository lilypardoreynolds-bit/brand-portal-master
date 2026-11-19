import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { canAccessPage, isViewerOnly } from "@/lib/permissions";
import { ShieldOff, Eye } from "lucide-react";

/**
 * Wraps a page/component and blocks access if the user doesn't have permission.
 * For viewer users, injects a CSS class that hides all action buttons.
 */
export default function PermissionGate({ page, children }) {
  const { user } = useAuth();

  if (!canAccessPage(user, page)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
        <ShieldOff className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-sm">
          Você ainda não tem permissão para acessar esta página. Entre em contato com o administrador do sistema para solicitar acesso.
        </p>
      </div>
    );
  }

  if (isViewerOnly(user)) {
    return (
      <div className="viewer-mode relative">
        <style>{`
          .viewer-mode button:not([data-viewer-allow]):not([data-state="active"]):not([data-radix-collection-item]),
          .viewer-mode [role="button"]:not([data-viewer-allow]) {
            pointer-events: none !important;
            opacity: 0.4 !important;
            cursor: not-allowed !important;
          }
          .viewer-mode [role="tab"] {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }
          .viewer-mode input,
          .viewer-mode textarea,
          .viewer-mode select {
            pointer-events: none !important;
            background-color: #f9fafb !important;
          }
        `}</style>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2 flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 flex-shrink-0" />
          Você está no modo <strong>somente leitura</strong>. Edições não são permitidas.
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}