import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, getMonth, getYear, getDaysInMonth } from "date-fns";
import { TrendingUp, Calendar, ArrowRight } from "lucide-react";

export default function CommissionCard() {
  const now = new Date();
  const currentMonth = getMonth(now);
  const currentYear = getYear(now);

  const { data: settings = [] } = useQuery({
    queryKey: ["commission_settings"],
    queryFn: () => base44.entities.CommissionSettings.list(),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders_for_commission"],
    queryFn: async () => {
      try {
        return await base44.entities.Order.list('-invoice_date', 300);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const commissionRate = settings[0]?.commission_rate || 5;
  const paymentDay = settings[0]?.payment_day || 10;

  // Calculate this month's gross sales
  const periodStart = new Date(currentYear, currentMonth, 1);
  const periodEnd = new Date(currentYear, currentMonth, getDaysInMonth(periodStart));

  const monthlyGrossSales = orders
    .filter((order) => {
      const orderDate = new Date(order.invoice_date);
      return orderDate >= periodStart && orderDate <= periodEnd;
    })
    .reduce((sum, order) => sum + (order.total || 0), 0);

  const commissionEarned = (monthlyGrossSales * commissionRate) / 100;
  const paymentDate = new Date(currentYear, currentMonth, Math.min(paymentDay, getDaysInMonth(periodStart)));

  const monthLabel = format(now, "MMMM");

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <span>Agency Commission</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">{monthLabel} Gross Sales</p>
              <p className="text-2xl font-bold text-slate-900">${monthlyGrossSales.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Commission Rate</p>
              <p className="text-2xl font-bold text-indigo-600">{commissionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Commission Earned</p>
              <p className="text-2xl font-bold text-green-600">${commissionEarned.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Next Payment</p>
              <p className="text-sm font-semibold text-slate-900">{format(paymentDate, "MMM d")}</p>
            </div>
          </div>

          {/* Action button */}
          <Link to={createPageUrl("AgencyCommission")} className="block mt-4">
            <Button variant="outline" className="w-full gap-2 border-indigo-300 hover:bg-indigo-100">
              <span>View Full Details</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}