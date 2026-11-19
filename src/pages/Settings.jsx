import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs">Full Name</Label>
              <p className="text-sm font-medium text-slate-900">{user?.full_name || "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs">Email</Label>
              <p className="text-sm font-medium text-slate-900">{user?.email || "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs">Role</Label>
              <p className="text-sm font-medium text-slate-900 capitalize">{user?.role || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Domain Expiry Alerts</p>
              <p className="text-xs text-slate-500">Get notified 30 days before expiration</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Lease Expiry Alerts</p>
              <p className="text-xs text-slate-500">Get notified 60 days before lease ends</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Certificate Alerts</p>
              <p className="text-xs text-slate-500">Resale certificate expiration reminders</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Trademark Renewal</p>
              <p className="text-xs text-slate-500">Trademark renewal approaching alerts</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">System</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Platform</p>
              <p className="font-medium text-slate-900">BrandOS v1.0</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Module</p>
              <p className="font-medium text-slate-900">Company Documentation</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Future modules: Inventory, Invoices, Financial Reports, Marketing, Pricing Strategy, Sales Analytics, KPI Dashboards
          </p>
        </CardContent>
      </Card>
    </div>
  );
}