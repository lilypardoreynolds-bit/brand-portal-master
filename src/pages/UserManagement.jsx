import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PERMISSION_SECTIONS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield, Users, Loader2, CheckCheck, X, Eye } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // userId being saved

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const list = await base44.entities.User.list();
    setUsers(list);
    setLoading(false);
  };

  const togglePermission = (userId, permKey) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const perms = u.permissions || [];
      const has = perms.includes(permKey);
      return { ...u, permissions: has ? perms.filter(p => p !== permKey) : [...perms, permKey] };
    }));
  };

  const grantAll = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, permissions: PERMISSION_SECTIONS.map(s => s.key) };
    }));
  };

  const revokeAll = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, permissions: [] };
    }));
  };

  const savePermissions = async (userId) => {
    setSaving(userId);
    const u = users.find(x => x.id === userId);
    await base44.entities.User.update(userId, { permissions: u.permissions || [], role: u.role });
    setSaving(null);
    toast.success("Permissões salvas!");
  };

  const toggleViewer = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const newRole = u.role === "viewer" ? "user" : "viewer";
      return { ...u, role: newRole };
    }));
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
        <Shield className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Admin Only</h2>
        <p className="text-slate-500 mt-2">Only administrators can manage user permissions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          User Permissions
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Control which sections each user can access. Admins always have full access.
        </p>
      </div>

      <div className="space-y-4">
        {users.map(u => {
          const isAdmin = u.role === "admin";
          const isViewer = u.role === "viewer";
          const permissions = u.permissions || [];
          const isMe = u.id === currentUser?.id;

          return (
            <Card key={u.id} className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {(u.full_name || u.email || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {u.full_name || u.email}
                        {isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <Badge className={
                      isAdmin ? "bg-amber-100 text-amber-700" :
                      isViewer ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    }>
                      {isAdmin ? "admin" : isViewer ? "viewer (somente leitura)" : "user"}
                    </Badge>
                  </div>

                  {!isAdmin && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant={isViewer ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleViewer(u.id)}
                        className="gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isViewer ? "Remover Viewer" : "Tornar Viewer"}
                      </Button>
                      {!isViewer && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => grantAll(u.id)} className="gap-1 text-xs">
                            <CheckCheck className="h-3.5 w-3.5" /> Liberar Tudo
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => revokeAll(u.id)} className="gap-1 text-xs">
                            <X className="h-3.5 w-3.5" /> Revogar Tudo
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() => savePermissions(u.id)}
                        disabled={saving === u.id}
                        className="gap-1 text-xs"
                      >
                        {saving === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {isAdmin ? (
                  <p className="text-xs text-slate-400 italic">
                    Admins têm acesso total a tudo — sem restrições.
                  </p>
                ) : isViewer ? (
                  <p className="text-xs text-blue-500 italic flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Viewer tem acesso de leitura a todas as seções, mas não pode criar, editar ou deletar nada.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {PERMISSION_SECTIONS.map(section => {
                      const checked = permissions.includes(section.key);
                      return (
                        <label
                          key={section.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm
                            ${checked ? "border-primary/40 bg-primary/5 text-slate-800" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => togglePermission(u.id, section.key)}
                          />
                          <span className="text-xs font-medium leading-tight">{section.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}