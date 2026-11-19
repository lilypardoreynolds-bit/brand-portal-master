import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, BarChart2, CalendarDays, FileText, LayoutDashboard } from "lucide-react";
import TaxComplianceDashboard from "@/components/tax/TaxComplianceDashboard";
import SalesTaxTable from "@/components/tax/SalesTaxTable";
import QuarterlyReports from "@/components/tax/QuarterlyReports";
import FilingCalendar from "@/components/tax/FilingCalendar";
import TaxDocuments from "@/components/tax/TaxDocuments";

const TABS = [
  { value: "dashboard",  label: "Dashboard",         icon: LayoutDashboard },
  { value: "tracking",   label: "Sales Tax Tracking", icon: BarChart2 },
  { value: "reports",    label: "Quarterly Reports",  icon: FileText },
  { value: "calendar",   label: "Filing Calendar",    icon: CalendarDays },
  { value: "documents",  label: "Tax Documents",      icon: FileText },
];

export default function TaxCompliance() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tax Compliance</h1>
            <p className="text-sm text-slate-400">Track sales tax, manage filings, and stay compliant</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-100 p-1 rounded-xl">
          {TABS.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <TaxComplianceDashboard />
        </TabsContent>
        <TabsContent value="tracking" className="mt-6">
          <SalesTaxTable />
        </TabsContent>
        <TabsContent value="reports" className="mt-6">
          <QuarterlyReports />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <FilingCalendar />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <TaxDocuments />
        </TabsContent>
      </Tabs>
    </div>
  );
}