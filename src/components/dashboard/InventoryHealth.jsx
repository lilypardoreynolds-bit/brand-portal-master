import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Boxes, AlertTriangle, FlaskConical, ArrowRight } from "lucide-react";

const STOCK_STATUS = (item) => {
  if (item.current_stock <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  if (item.current_stock <= item.min_stock_level) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
  return { label: "OK", color: "bg-emerald-100 text-emerald-700" };
};

export default function InventoryHealth({ inventory = [], productIdeas = [] }) {
  const totalValue = inventory.reduce((sum, i) => sum + (i.current_stock * (i.unit_cost || 0)), 0);
  const lowStock = inventory.filter(i => i.current_stock <= i.min_stock_level && i.current_stock > 0).length;
  const outOfStock = inventory.filter(i => i.current_stock <= 0).length;
  const inDevelopment = productIdeas.filter(p => p.status !== "Ready to Launch" && p.status !== "Launched").length;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Inventory & Product Health</CardTitle>
        <Link to={createPageUrl("Inventory")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Boxes, label: "Inventory Value", value: `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "bg-indigo-50 text-indigo-600" },
            { icon: AlertTriangle, label: "Low Stock", value: lowStock, color: "bg-amber-50 text-amber-600" },
            { icon: AlertTriangle, label: "Out of Stock", value: outOfStock, color: "bg-red-50 text-red-600" },
            { icon: FlaskConical, label: "In Development", value: inDevelopment, color: "bg-violet-50 text-violet-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 flex items-center gap-2.5 ${color.split(" ")[0]}`}>
              <Icon className={`h-4 w-4 ${color.split(" ")[1]} flex-shrink-0`} />
              <div>
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className={`text-base font-bold ${color.split(" ")[1]}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Product table */}
        {inventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Product</th>
                  <th className="text-left pb-2 font-medium">SKU</th>
                  <th className="text-right pb-2 font-medium">Stock</th>
                  <th className="text-left pb-2 font-medium pl-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.slice(0, 6).map(item => {
                  const status = STOCK_STATUS(item);
                  return (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-2 pr-2 font-medium text-slate-800">{item.product_name}</td>
                      <td className="py-2 pr-2 text-slate-400">{item.sku || "—"}</td>
                      <td className="py-2 pr-2 text-right font-semibold text-slate-700">{item.current_stock}</td>
                      <td className="py-2 pl-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No inventory data yet</p>
        )}
      </CardContent>
    </Card>
  );
}