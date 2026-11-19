import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MGMT_RATE, OPEX_RATE, MKT_RATE, PROCESSING_FEE_RATE } from "./pricingCalc";

function NumInput({ label, value, onChange, suffix, prefix = "$", step = "0.01" }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="relative">
        {prefix && !suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>
        )}
        <Input
          type="number"
          min="0"
          step={step}
          className={prefix && !suffix ? "pl-6" : suffix ? "pr-8" : ""}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function FixedRateRow({ label, rate }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-indigo-600">{(rate * 100) % 1 === 0 ? (rate * 100).toFixed(0) : (rate * 100).toFixed(1)}%</span>
    </div>
  );
}

export default function PricingInputs({ form, onChange }) {
  const set = (k, v) => onChange({ ...form, [k]: v });
  const landed = (form.product_cost || 0) + (form.shipping_cost || 0) + (form.import_cost || 0) + (form.import_extra_costs || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Cost Structure — Importation */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Importation</p>
            <p className="text-[10px] text-slate-400 mb-3">Cost of goods landed</p>
            <div className="space-y-3">
              <NumInput label="Product Cost" value={form.product_cost} onChange={v => set("product_cost", v)} />
              <NumInput label="Shipping Cost" value={form.shipping_cost} onChange={v => set("shipping_cost", v)} />
              <NumInput label="Fees (Duties / Customs)" value={form.import_cost} onChange={v => set("import_cost", v)} />
              <NumInput label="Extra Costs (Labels, Tags, Packaging)" value={form.import_extra_costs || 0} onChange={v => set("import_extra_costs", v)} />
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-400 font-medium">Landed Cost</p>
              <p className="text-lg font-bold text-slate-900">${landed.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* OPS — Fixed Rates */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">OPS</p>
            <p className="text-[10px] text-slate-400 mb-3">Applied to revenue on all channels</p>
            <div className="divide-y divide-slate-100">
              <FixedRateRow label="Management" rate={MGMT_RATE} />
              <FixedRateRow label="OPEX" rate={OPEX_RATE} />
              <FixedRateRow label="MKT (Ads)" rate={MKT_RATE} />
            </div>
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-indigo-600 font-medium">Total OPS</p>
                <p className="text-base font-bold text-indigo-700">25%</p>
              </div>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              <FixedRateRow label="Processing Fee (Sales)" rate={PROCESSING_FEE_RATE} />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-2">Shipping OPS Extras <span className="text-indigo-500">(Shopify only)</span></p>
              <NumInput label="OPS Extra Costs (Box, Tape, Flyers)" value={form.ops_extra_costs || 0} onChange={v => set("ops_extra_costs", v)} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing + Channel Fees */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pricing</p>
            <p className="text-[10px] text-slate-400 mb-3">Target prices per channel</p>
            <div className="space-y-3">
              <NumInput label="Retail Price (Amazon / Shopify)" value={form.retail_price} onChange={v => set("retail_price", v)} />
              <NumInput label="Wholesale Price" value={form.wholesale_price} onChange={v => set("wholesale_price", v)} />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Channel Fees</p>
              <div className="space-y-3">
                <NumInput label="Amazon FBA Total Fee" value={form.amazon_fba_fee} onChange={v => set("amazon_fba_fee", v)} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Shopify & Wholesale: no additional channel fee</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* External Links */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">External Links</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Amazon Competitor Link</Label>
              <Input
                type="url"
                placeholder="https://amazon.com/dp/..."
                value={form.amazon_competitor_link || ""}
                onChange={(e) => set("amazon_competitor_link", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Alibaba Manufacturer Link</Label>
              <Input
                type="url"
                placeholder="https://alibaba.com/..."
                value={form.alibaba_manufacturer_link || ""}
                onChange={(e) => set("alibaba_manufacturer_link", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}