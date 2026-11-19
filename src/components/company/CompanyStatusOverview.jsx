import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  FileText, CreditCard, Building, Landmark, ShieldCheck, MapPin, Phone, Globe
} from "lucide-react";

const statusItems = [
  { key: "formation_status", label: "Company Formation", icon: FileText },
  { key: "ein_status", label: "EIN", icon: CreditCard },
  { key: "bank_status", label: "Business Bank Account", icon: Landmark },
  { key: "trademark_status", label: "Trademark Registration", icon: ShieldCheck },
  { key: "resale_cert_status", label: "Resale Certificate", icon: Building },
  { key: "lease_status", label: "Business Address Lease", icon: MapPin },
  { key: "phone_status", label: "Corporate Phone", icon: Phone },
  { key: "domains_status", label: "Domains", icon: Globe },
];

export default function CompanyStatusOverview({ company }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {statusItems.map((item) => (
        <Card key={item.key} className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <item.icon className="h-4 w-4 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{item.label}</p>
              <div className="mt-1">
                <StatusBadge status={company[item.key] || "pending"} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}