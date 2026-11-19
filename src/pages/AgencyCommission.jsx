import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommissionReports from "@/components/commission/CommissionReports";
import CommissionStatement from "@/components/commission/CommissionStatement";
import CommissionInvoices from "@/components/commission/CommissionInvoices";
import { BarChart3, FileText, Receipt } from "lucide-react";

export default function AgencyCommission() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const handleMonthChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Agency Commission Management</h1>
        <p className="text-slate-600">Manage commission settings, reports, and invoicing</p>
      </div>

      {/* Fixed Settings Display */}
      <div className="mb-8 bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission Rate</h2>
        <div className="text-3xl font-bold text-slate-900">15%</div>
        <p className="text-sm text-slate-500 mt-1">Fixed commission rate on gross sales</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="statement" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="statement" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Statement</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
        </TabsList>

        {/* Commission Statement */}
        <TabsContent value="statement" className="space-y-6">
          <CommissionStatement
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
          />
        </TabsContent>

        {/* Commission Reports */}
        <TabsContent value="reports" className="space-y-6">
          <CommissionReports />
        </TabsContent>

        {/* Commission Invoices */}
        <TabsContent value="invoices" className="space-y-6">
          <CommissionInvoices />
        </TabsContent>
      </Tabs>
    </div>
  );
}