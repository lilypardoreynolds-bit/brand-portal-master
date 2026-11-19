import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, Loader2, CheckCircle2, AlertTriangle, Pencil, Trash2, Paperclip, X } from "lucide-react";
import { useAppSettings } from "@/lib/appSettings";
import { isViewerOnly } from "@/lib/permissions";
import {
  INCOME_FIELDS, EXPENSE_FIELDS, CHANNEL_OPTIONS,
  computeTotals, findOverlap, saveChannelReport, deleteChannelReport,
} from "@/lib/channelReport";

const money = (n) => {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function emptyDraft(channel) {
  const d = { channel, period_start: "", period_end: "", units_sold: "", orders_count: "", deposited_amount: "", marketplace_withheld_tax: "", notes: "", report_file_urls: [] };
  [...INCOME_FIELDS, ...EXPENSE_FIELDS].forEach((f) => (d[f.key] = ""));
  return d;
}

function MoneyField({ field, value, onChange, disabled }) {
  return (
    <div className="grid grid-cols-[1fr_140px] items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <div>
        <Label htmlFor={field.key} className="text-sm font-medium text-slate-800">{field.label}</Label>
        {field.hint && <p className="text-[11px] text-slate-400 leading-tight">{field.hint}</p>}
      </div>
      <Input id={field.key} name={field.key} type="number" min={0} step="0.01" inputMode="decimal" value={value} disabled={disabled}
        onChange={(e) => onChange(field.key, e.target.value)} placeholder="0.00" className="h-9 text-right" />
    </div>
  );
}

/** Weekly channel report (Amazon, TikTok Shop, Shopify...) entered by hand from the channel's own report. */
export default function ChannelReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const readOnly = isViewerOnly(user);
  const { salesChannels } = useAppSettings();
  const channels = Array.from(new Set([...(salesChannels || []), ...CHANNEL_OPTIONS]));

  const [tab, setTab] = useState("entry");
  const [draft, setDraft] = useState(() => emptyDraft("Amazon"));
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: reports = [] } = useQuery({
    queryKey: ["channel_reports"],
    queryFn: () => base44.entities.ChannelReport.list("-period_end", 500),
    initialData: [],
  });

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const totals = computeTotals(draft);
  const overlap = findOverlap(reports, draft, editing?.id);
  const deposited = Number(draft.deposited_amount) || 0;
  const diff = deposited ? Math.round((deposited - totals.net_amount) * 100) / 100 : null;

  const errors = [];
  if (!draft.channel) errors.push("Choose the channel");
  if (!draft.period_start || !draft.period_end) errors.push("Fill in the period start and end dates");
  if (draft.period_start && draft.period_end && draft.period_start > draft.period_end) errors.push("Period start must be before period end");
  if (overlap) errors.push(`A ${overlap.channel} report already covers ${overlap.period_start} → ${overlap.period_end}. Edit that one instead.`);

  const startEdit = (r) => {
    const d = emptyDraft(r.channel);
    Object.keys(d).forEach((k) => (d[k] = r[k] ?? d[k]));
    setDraft(d);
    setEditing(r);
    setLastSaved(null);
    setTab("entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setDraft(emptyDraft(draft.channel));
    setEditing(null);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("report_file_urls", [...(draft.report_file_urls || []), file_url]);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (errors.length) return;
    setSaving(true);
    try {
      const saved = await saveChannelReport(draft, editing, user);
      qc.invalidateQueries({ queryKey: ["channel_reports"] });
      qc.invalidateQueries({ queryKey: ["ledger_transactions"] });
      setLastSaved(saved);
      toast({ title: editing ? "Report updated" : "Report saved", description: `${saved.channel} ${saved.period_start} → ${saved.period_end}: net ${money(saved.net_amount)}` });
      reset();
    } catch (e) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (r) => {
    if (!confirm(`Delete the ${r.channel} report for ${r.period_start} → ${r.period_end}? Its ledger entries will be removed too.`)) return;
    await deleteChannelReport(r);
    qc.invalidateQueries({ queryKey: ["channel_reports"] });
    qc.invalidateQueries({ queryKey: ["ledger_transactions"] });
    toast({ title: "Report deleted" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Inbox className="h-6 w-6 text-[var(--brand)]" /> Channel Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter each week's report from Amazon, TikTok Shop or Shopify. Every line is posted to the ledger as revenue or operating cost, so the P&L stays real.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="entry">{editing ? "Edit report" : "New report"}</TabsTrigger>
          <TabsTrigger value="history">History ({reports.length})</TabsTrigger>
          <TabsTrigger value="pnl">Monthly P&amp;L</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-4 space-y-4">
          {lastSaved && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p>Saved <strong>{lastSaved.channel}</strong> {lastSaved.period_start} → {lastSaved.period_end}. Income {money(lastSaved.total_income)} − expenses {money(lastSaved.total_expenses)} = <strong>net {money(lastSaved.net_amount)}</strong>. {lastSaved.ledger_transaction_ids?.length || 0} ledger lines posted.</p>
            </div>
          )}

          {readOnly ? (
            <p className="text-sm text-slate-500">You have view-only access.</p>
          ) : (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-base">1. Channel and period</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Channel</Label>
                    <Select value={draft.channel} onValueChange={(v) => set("channel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{channels.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="period_start">Period start</Label>
                    <Input id="period_start" type="date" value={draft.period_start} onChange={(e) => set("period_start", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="period_end">Period end</Label>
                    <Input id="period_end" type="date" value={draft.period_end} onChange={(e) => set("period_end", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="units_sold">Units sold</Label>
                    <Input id="units_sold" type="number" min={0} value={draft.units_sold} onChange={(e) => set("units_sold", e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="orders_count">Orders</Label>
                    <Input id="orders_count" type="number" min={0} value={draft.orders_count} onChange={(e) => set("orders_count", e.target.value)} placeholder="0" />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base text-emerald-700">2. Income</CardTitle>
                    <p className="text-xs text-slate-500">Enter amounts as positive numbers.</p>
                  </CardHeader>
                  <CardContent>
                    {INCOME_FIELDS.map((f) => <MoneyField key={f.key} field={f} value={draft[f.key]} onChange={set} />)}
                    <div className="flex justify-between pt-3 text-sm font-semibold text-emerald-700"><span>Total income</span><span>{money(totals.total_income)}</span></div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base text-amber-700">3. Fees and expenses</CardTitle>
                    <p className="text-xs text-slate-500">Enter amounts as positive numbers, even if the report shows them negative.</p>
                  </CardHeader>
                  <CardContent>
                    {EXPENSE_FIELDS.map((f) => <MoneyField key={f.key} field={f} value={draft[f.key]} onChange={set} />)}
                    <div className="flex justify-between pt-3 text-sm font-semibold text-amber-700"><span>Total expenses</span><span>{money(totals.total_expenses)}</span></div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-base">4. Check and attach</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-50 border p-3">
                      <p className="text-xs text-slate-500">Net (calculated)</p>
                      <p className={`text-xl font-bold ${totals.net_amount < 0 ? "text-red-600" : "text-slate-900"}`}>{money(totals.net_amount)}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deposited_amount">Amount deposited to bank</Label>
                      <Input id="deposited_amount" type="number" step="0.01" value={draft.deposited_amount} onChange={(e) => set("deposited_amount", e.target.value)} placeholder="Optional" />
                      {diff !== null && (
                        <p className={`text-xs ${Math.abs(diff) < 0.01 ? "text-emerald-600" : "text-amber-600"}`}>
                          {Math.abs(diff) < 0.01 ? "Matches the calculated net ✓" : `Difference of ${money(diff)} vs calculated net`}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="marketplace_withheld_tax">Marketplace withheld tax (memo)</Label>
                      <Input id="marketplace_withheld_tax" type="number" step="0.01" value={draft.marketplace_withheld_tax} onChange={(e) => set("marketplace_withheld_tax", e.target.value)} placeholder="Not revenue" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Original report file</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {(draft.report_file_urls || []).map((u, i) => (
                        <span key={u} className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded px-2 py-1">
                          <a href={u} target="_blank" rel="noreferrer" className="hover:underline">File {i + 1}</a>
                          <button type="button" onClick={() => set("report_file_urls", draft.report_file_urls.filter((x) => x !== u))}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                      <label className="inline-flex items-center gap-1 text-sm text-indigo-600 cursor-pointer hover:underline">
                        <Paperclip className="h-4 w-4" /> {uploading ? "Uploading..." : "Attach file"}
                        <input type="file" className="hidden" onChange={handleUpload} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
                  </div>

                  {errors.length > 0 && (draft.period_start || draft.period_end) && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <ul className="list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {editing && <Button variant="outline" onClick={reset}>Cancel edit</Button>}
                    <Button onClick={handleSave} disabled={saving || errors.length > 0} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editing ? "Update report" : "Save report"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0 overflow-x-auto">
              {reports.length === 0 ? (
                <p className="text-sm text-slate-400 p-6 text-center">No reports yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                      <th className="text-left px-4 py-2">Channel</th>
                      <th className="text-left px-4 py-2">Period</th>
                      <th className="text-right px-4 py-2">Units</th>
                      <th className="text-right px-4 py-2">Income</th>
                      <th className="text-right px-4 py-2">Expenses</th>
                      <th className="text-right px-4 py-2">Net</th>
                      <th className="text-right px-4 py-2">Deposited</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{r.channel}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-slate-600">{r.period_start} → {r.period_end}</td>
                        <td className="px-4 py-2 text-right">{r.units_sold || 0}</td>
                        <td className="px-4 py-2 text-right text-emerald-700">{money(r.total_income)}</td>
                        <td className="px-4 py-2 text-right text-amber-700">{money(r.total_expenses)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{money(r.net_amount)}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{r.deposited_amount ? money(r.deposited_amount) : "—"}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {!readOnly && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl" className="mt-4">
          <MonthlyPnL month={month} setMonth={setMonth} reports={reports} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Operating P&L for one month: channel reports + creator samples + brand expenses. */
function MonthlyPnL({ month, setMonth, reports }) {
  const { data: consumptions = [] } = useQuery({
    queryKey: ["inventory_consumptions"],
    queryFn: () => base44.entities.InventoryConsumption.list("-date", 1000),
    initialData: [],
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses_for_pnl"],
    queryFn: () => base44.entities.Expense.list("-date", 1000),
    initialData: [],
  });

  const data = useMemo(() => {
    const inMonth = (d) => (d || "").startsWith(month);
    const monthReports = reports.filter((r) => inMonth(r.period_end));
    const sumField = (key) => monthReports.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    const income = INCOME_FIELDS.map((f) => ({ label: f.label, value: sumField(f.key) })).filter((x) => x.value);
    const channelCosts = EXPENSE_FIELDS.map((f) => ({ label: f.label, value: sumField(f.key) })).filter((x) => x.value);
    const totalIncome = income.reduce((s, x) => s + x.value, 0);
    const totalChannel = channelCosts.reduce((s, x) => s + x.value, 0);

    const monthCons = consumptions.filter((c) => inMonth(c.date));
    const byReason = {};
    let shippingTotal = 0;
    monthCons.forEach((c) => {
      byReason[c.reason] = (byReason[c.reason] || 0) + (Number(c.total_value) || 0);
      shippingTotal += Number(c.shipping_cost) || 0;
    });
    const consumptionLines = Object.entries(byReason).map(([label, value]) => ({ label: `${label} (product cost)`, value })).filter((x) => x.value);
    if (shippingTotal) consumptionLines.push({ label: "Sample shipping", value: shippingTotal });
    const totalCons = consumptionLines.reduce((s, x) => s + x.value, 0);

    const byCat = {};
    expenses.filter((e) => inMonth(e.date)).forEach((e) => {
      const k = e.category || "Other";
      byCat[k] = (byCat[k] || 0) + (Number(e.amount) || 0);
    });
    const expenseLines = Object.entries(byCat).map(([label, value]) => ({ label, value })).filter((x) => x.value);
    const totalExp = expenseLines.reduce((s, x) => s + x.value, 0);

    return {
      reportsCount: monthReports.length,
      income, channelCosts, consumptionLines, expenseLines,
      totalIncome, totalChannel, totalCons, totalExp,
      channelNet: totalIncome - totalChannel,
      operating: totalIncome - totalChannel - totalCons - totalExp,
    };
  }, [month, reports, consumptions, expenses]);

  const Section = ({ title, lines, total, tone }) => (
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase ${tone}`}>{title}</p>
      {lines.length === 0 ? <p className="text-sm text-slate-400 pl-3">—</p> : lines.map((l) => (
        <div key={l.label} className="flex justify-between text-sm pl-3"><span className="text-slate-600">{l.label}</span><span>{money(l.value)}</span></div>
      ))}
      <div className="flex justify-between text-sm font-semibold border-t pt-1"><span>Total</span><span>{money(total)}</span></div>
    </div>
  );

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Operating P&amp;L</CardTitle>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44 h-9" />
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-slate-500">
          Based on {data.reportsCount} channel report(s) ending in this month, creator samples / consumption, and Brand Expenses.
          Cost of goods sold for units sold is not included yet.
        </p>
        <Section title="Channel income" lines={data.income} total={data.totalIncome} tone="text-emerald-700" />
        <Section title="Channel fees & expenses" lines={data.channelCosts} total={data.totalChannel} tone="text-amber-700" />
        <div className="flex justify-between font-semibold bg-slate-50 rounded px-3 py-2"><span>Channel net</span><span>{money(data.channelNet)}</span></div>
        <Section title="Samples & inventory consumption" lines={data.consumptionLines} total={data.totalCons} tone="text-pink-700" />
        <Section title="Brand expenses" lines={data.expenseLines} total={data.totalExp} tone="text-slate-700" />
        <div className={`flex justify-between text-lg font-bold rounded px-3 py-3 ${data.operating < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          <span>Operating result</span><span>{money(data.operating)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
