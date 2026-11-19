import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format, isThisWeek, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, Bell, CheckCircle2, Clock, DollarSign,
  TrendingUp, Megaphone, Boxes, ArrowRight, Edit2, Check,
  Rocket, Heart, Target, Package, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Tiny helpers ────────────────────────────────────────────────────────────

const STAGE_CONFIG = {
  Idea:        { bg: "bg-slate-100",  text: "text-slate-700",  dot: "bg-slate-400"  },
  Development: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  Launching:   { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  Scaling:     { bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-500"},
};
const HEALTH_CONFIG = {
  "On Track":        { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Attention Needed":{ bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"  },
  "Critical":        { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"    },
};

function StatusPill({ label, config }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dot}`} />
      {label}
    </span>
  );
}

function StatBox({ icon: Icon, label, value, color = "text-slate-900", bg = "bg-slate-50", link }) {
  const inner = (
    <div className={`rounded-2xl p-5 flex flex-col gap-2 ${bg} h-full`}>
      <Icon className={`h-5 w-5 ${color} opacity-70`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-slate-500 leading-tight">{label}</p>
    </div>
  );
  if (link) return <Link to={createPageUrl(link)} className="block">{inner}</Link>;
  return inner;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useLanguage();
  const d = t.dashboard;
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingUpdates, setEditingUpdates] = useState(false);

  // Data fetching
  const { data: companies = [] } = useQuery({ queryKey: ["company_profile"], queryFn: () => base44.entities.Company.list("-created_date", 1), initialData: [] });
  const { data: brandOverviews = [] } = useQuery({ queryKey: ["brand_overview"], queryFn: () => base44.entities.BrandOverview.list("-created_date", 1), initialData: [] });
  const { data: notifications = [] } = useQuery({ queryKey: ["unread_notifications"], queryFn: () => base44.entities.Notification.filter({ is_read: false }), initialData: [] });
  const { data: domains = [] } = useQuery({ queryKey: ["domains"], queryFn: () => base44.entities.Domain.list(), initialData: [] });
  const { data: orders = [] } = useQuery({ queryKey: ["orders_dashboard"], queryFn: () => base44.entities.Order.list("-order_date", 100), initialData: [] });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks_dashboard"], queryFn: () => base44.entities.Task.list("-due_date"), initialData: [] });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory_dashboard"], queryFn: () => base44.entities.Inventory.list("product_name"), initialData: [] });
  const { data: channels = [] } = useQuery({ queryKey: ["marketing_channels_dashboard"], queryFn: () => base44.entities.MarketingChannel.list(), initialData: [] });
  const { data: taxFilings = [] } = useQuery({ queryKey: ["tax_filing_records_dash"], queryFn: () => base44.entities.TaxFilingRecord.list(), initialData: [] });
  const { data: leaseDocs = [] } = useQuery({ queryKey: ["lease_docs_dash"], queryFn: () => base44.entities.Document.filter({ category: "lease" }), initialData: [] });

  const company = companies[0];
  const brandOverview = brandOverviews[0];
  const brandName = company?.brand_name || company?.company_name || "Your Brand";

  // Local form state
  const [statusForm, setStatusForm] = useState({
    brand_stage: brandOverview?.brand_stage || "Development",
    brand_health: brandOverview?.brand_health || "On Track",
    current_focus: brandOverview?.current_focus || "",
  });
  const [updatesForm, setUpdatesForm] = useState({
    this_week_progress: brandOverview?.this_week_progress || "",
    waiting_on_client: brandOverview?.waiting_on_client || "",
    next_steps: brandOverview?.next_steps || "",
  });

  // Sync form when data loads
  useEffect(() => {
    if (brandOverview) {
      setStatusForm({ brand_stage: brandOverview.brand_stage || "Development", brand_health: brandOverview.brand_health || "On Track", current_focus: brandOverview.current_focus || "" });
      setUpdatesForm({ this_week_progress: brandOverview.this_week_progress || "", waiting_on_client: brandOverview.waiting_on_client || "", next_steps: brandOverview.next_steps || "" });
    }
  }, [brandOverview?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => brandOverview?.id
      ? base44.entities.BrandOverview.update(brandOverview.id, data)
      : base44.entities.BrandOverview.create({ brand_name: brandName, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brand_overview"] }),
  });

  // Computed values
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const monthlyRevenue = orders.filter(o => o.order_date && new Date(o.order_date) >= monthStart).reduce((s, o) => s + (o.total || 0), 0);
  const openTasks = tasks.filter(t => t.status !== "Completed");
  const dueThisWeek = openTasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date))).length;
  const lowStock = inventory.filter(i => i.current_stock <= i.min_stock_level && i.current_stock > 0).length + inventory.filter(i => i.current_stock <= 0).length;
  const activeChannels = channels.filter(c => c.is_active).length;
  const monthlyOpCosts = leaseDocs.reduce((sum, d) => sum + (Number(d.monthly_payment) || 0), 0);

  const expiringDomains = domains.filter(d => {
    if (!d.expiration_date) return false;
    const days = differenceInDays(new Date(d.expiration_date), new Date());
    return days >= 0 && days <= 30;
  });

  // Tax filing alerts
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const TAX_DEADLINES = [
    { q: "Q1", deadlineMonth: 3, deadlineDay: 21, reminderDay: 10 },
    { q: "Q2", deadlineMonth: 6, deadlineDay: 21, reminderDay: 10 },
    { q: "Q3", deadlineMonth: 9, deadlineDay: 21, reminderDay: 10 },
    { q: "Q4", deadlineMonth: 0, deadlineDay: 21, reminderDay: 10, yearOffset: 1 },
  ];
  const taxAlert = (() => {
    const today = new Date();
    for (const td of TAX_DEADLINES) {
      const yr = td.yearOffset ? currentYear + td.yearOffset : currentYear;
      const reminder = new Date(yr, td.deadlineMonth, td.reminderDay);
      const deadline = new Date(yr, td.deadlineMonth, td.deadlineDay);
      if (isAfter(today, reminder) && !isAfter(today, deadline)) {
        const filed = taxFilings.find(f => f.quarter === td.q && f.year === (td.yearOffset ? currentYear : currentYear) && f.status === "Filed");
        if (!filed) return { q: td.q, deadline, overdue: false };
      }
      if (isAfter(today, deadline)) {
        const daysPast = differenceInDays(today, deadline);
        if (daysPast <= 30) {
          const filed = taxFilings.find(f => f.quarter === td.q && f.status === "Filed");
          if (!filed) return { q: td.q, deadline, overdue: true };
        }
      }
    }
    return null;
  })();

  const stageConf = STAGE_CONFIG[statusForm.brand_stage] || STAGE_CONFIG["Development"];
  const healthConf = HEALTH_CONFIG[statusForm.brand_health] || HEALTH_CONFIG["On Track"];

  const handleSaveStatus = () => { saveMutation.mutate(statusForm); setEditingStatus(false); };
  const handleSaveUpdates = () => { saveMutation.mutate(updatesForm); setEditingUpdates(false); };

  const renderBullets = (text) => {
    if (!text) return <p className="text-sm text-slate-400 italic">Nothing added yet</p>;
    return (
      <ul className="space-y-1.5">
        {text.split("\n").filter(Boolean).map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
            {line}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">

      {/* ── Header ── */}
       <div className="flex items-center justify-between">
         <div>
           <img
             src="https://media.base44.com/images/public/6a4bf76db572f02bc4b3c496/a06686e52_mee-logo.png"
             alt="U•Joy"
             className="h-16 w-auto object-contain mb-2"
           />
           <p className="text-slate-400 text-sm mt-1">{d.lastUpdated} {format(new Date(), "MMMM d, yyyy")}</p>
         </div>
        {notifications.length > 0 && (
          <Link to={createPageUrl("Notifications")}>
            <Button variant="outline" size="sm" className="gap-2 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100">
              <Bell className="h-4 w-4" /> {notifications.length} {notifications.length !== 1 ? d.alerts : d.alert}
            </Button>
          </Link>
        )}
      </div>

      {/* ── Tax Filing Alert ── */}
      {taxAlert && (
        <div className={`flex items-center gap-3 rounded-xl p-4 border ${taxAlert.overdue ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <Shield className={`h-5 w-5 flex-shrink-0 ${taxAlert.overdue ? "text-red-500" : "text-amber-500"}`} />
          <p className={`text-sm flex-1 ${taxAlert.overdue ? "text-red-800" : "text-amber-800"}`}>
            {taxAlert.overdue
              ? <><strong>Sales tax filing overdue!</strong> {taxAlert.q} return was due {format(taxAlert.deadline, "MMMM d")}. Submit immediately.</>
              : <><strong>Tax filing reminder:</strong> {taxAlert.q} quarterly sales tax return is due {format(taxAlert.deadline, "MMMM d")}. Begin preparing your report.</>
            }
          </p>
          <Link to={createPageUrl("TaxCompliance")}><Button size="sm" variant="outline" className={taxAlert.overdue ? "border-red-300 text-red-700" : "border-amber-300 text-amber-700"}>View</Button></Link>
        </div>
      )}

      {/* ── Expiring domain alert ── */}
      {expiringDomains.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">
            <strong>{d.domainExpiringSoon}</strong> {expiringDomains.map(dom => dom.domain_name).join(", ")}
          </p>
          <Link to={createPageUrl("Domains")}><Button size="sm" variant="outline" className="border-red-300 text-red-700">{d.view}</Button></Link>
        </div>
      )}

      {/* ── Brand Status ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{d.brandStatus}</h2>
          {isAdmin && (
            <button onClick={() => editingStatus ? handleSaveStatus() : setEditingStatus(true)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
              {editingStatus ? <><Check className="h-3.5 w-3.5" /> {d.save}</> : <><Edit2 className="h-3.5 w-3.5" /> {d.edit}</>}
            </button>
          )}
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Stage */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Rocket className="h-3.5 w-3.5" /> {d.stage}</p>
              {editingStatus ? (
                <Select value={statusForm.brand_stage} onValueChange={v => setStatusForm(f => ({ ...f, brand_stage: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(STAGE_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              ) : <StatusPill label={statusForm.brand_stage} config={stageConf} />}
            </div>
            {/* Health */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> {d.health}</p>
              {editingStatus ? (
                <Select value={statusForm.brand_health} onValueChange={v => setStatusForm(f => ({ ...f, brand_health: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(HEALTH_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              ) : <StatusPill label={statusForm.brand_health} config={healthConf} />}
            </div>
            {/* Focus */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {d.currentFocus}</p>
              {editingStatus
                ? <Input className="h-9" value={statusForm.current_focus} onChange={e => setStatusForm(f => ({ ...f, current_focus: e.target.value }))} placeholder={d.focusPlaceholder} />
                : <p className="text-sm font-medium text-slate-800">{statusForm.current_focus || <span className="text-slate-400 italic">{d.notSet}</span>}</p>
              }
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Key Numbers ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{d.keyNumbers}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox icon={DollarSign} label={d.revenueThisMonth} value={`$${monthlyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} color="text-emerald-700" bg="bg-emerald-50" link="SalesDashboard" />
          <StatBox icon={Clock} label={d.tasksDueThisWeek} value={dueThisWeek} color="text-amber-700" bg="bg-amber-50" link="Operations" />
          <StatBox icon={Boxes} label={d.inventoryAlerts} value={lowStock} color={lowStock > 0 ? "text-red-700" : "text-slate-700"} bg={lowStock > 0 ? "bg-red-50" : "bg-slate-50"} link="Inventory" />
          <StatBox icon={Megaphone} label={d.activeMarketingChannels} value={activeChannels} color="text-indigo-700" bg="bg-indigo-50" link="MarketingHub" />
          {monthlyOpCosts > 0 && (
            <StatBox icon={TrendingUp} label="Monthly Op. Costs" value={`$${monthlyOpCosts.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo`} color="text-rose-700" bg="bg-rose-50" link="Documentation" />
          )}
        </div>
      </section>

      {/* ── Open Tasks ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{d.openTasks}</h2>
          <Link to={createPageUrl("Operations")} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            {d.allTasks} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {openTasks.length === 0 ? (
              <div className="flex items-center gap-3 p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-sm text-slate-500">{d.allCaughtUp}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {openTasks.slice(0, 6).map(task => (
                  <li key={task.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${task.priority === "High" ? "bg-red-500" : task.priority === "Medium" ? "bg-amber-400" : "bg-slate-300"}`} />
                      <p className="text-sm font-medium text-slate-800 truncate">{task.task_name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {task.assigned_to && <p className="text-xs text-slate-400 hidden sm:block">{task.assigned_to}</p>}
                      {task.due_date && (
                        <p className={`text-xs font-medium ${isThisWeek(new Date(task.due_date)) ? "text-amber-600" : "text-slate-400"}`}>
                          {format(new Date(task.due_date), "MMM d")}
                        </p>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {task.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── This Week Update (Client Updates) ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{d.thisWeekUpdate}</h2>
          {isAdmin && (
            <button onClick={() => editingUpdates ? handleSaveUpdates() : setEditingUpdates(true)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
              {editingUpdates ? <><Check className="h-3.5 w-3.5" /> {d.save}</> : <><Edit2 className="h-3.5 w-3.5" /> {d.edit}</>}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "this_week_progress", label: d.progressMade, bg: "bg-emerald-50", border: "border-emerald-200" },
            { key: "waiting_on_client",  label: d.waitingOnYou,  bg: "bg-amber-50",   border: "border-amber-200"  },
            { key: "next_steps",         label: d.nextSteps,     bg: "bg-indigo-50",  border: "border-indigo-200" },
          ].map(area => (
            <div key={area.key} className={`rounded-2xl p-5 border ${area.bg} ${area.border}`}>
              <p className="text-sm font-semibold text-slate-700 mb-3">{area.label}</p>
              {editingUpdates
                ? <Textarea className="text-sm min-h-[90px] bg-white" value={updatesForm[area.key]} onChange={e => setUpdatesForm(f => ({ ...f, [area.key]: e.target.value }))} placeholder="One item per line..." />
                : renderBullets(updatesForm[area.key])
              }
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}