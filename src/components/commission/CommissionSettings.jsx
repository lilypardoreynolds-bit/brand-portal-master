import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, AlertCircle } from "lucide-react";

export default function CommissionSettings() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["commission_settings"],
    queryFn: async () => {
      const all = await base44.entities.CommissionSettings.list();
      return all[0] || { commission_rate: 5, calculation_base: "Gross Sales", payment_day: 10 };
    },
  });

  const [formData, setFormData] = useState(settings || {});

  React.useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        await base44.entities.CommissionSettings.update(settings.id, {
          ...data,
          last_updated: new Date().toISOString().split("T")[0],
        });
      } else {
        await base44.entities.CommissionSettings.create({
          ...data,
          last_updated: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Commission Settings</span>
          {saved && <Check className="h-4 w-4 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-slate-700">Management Commission Rate (%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.commission_rate || 5}
            onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
            className="mt-1.5"
          />
          <p className="text-xs text-slate-500 mt-1">Commission as percentage of gross sales</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Calculation Base</Label>
          <div className="mt-1.5 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 border">
            {formData.calculation_base || "Gross Sales"}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Payment Day (Monthly)</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.payment_day || 10}
            onChange={(e) => setFormData({ ...formData, payment_day: parseInt(e.target.value) })}
            className="mt-1.5"
          />
          <p className="text-xs text-slate-500 mt-1">Commission payment due on this day each month</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Commission is calculated as: <strong>Gross Revenue × Commission Rate</strong></p>
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}