import { base44 } from "@/api/base44Client";

/**
 * Field definitions for the weekly channel report.
 * Labels follow the wording of Amazon's Payments / Transaction report so whoever fills the
 * form can copy line by line. All amounts are entered as POSITIVE numbers.
 */
export const INCOME_FIELDS = [
  { key: "product_sales", label: "Product sales", category: "Product Sales", hint: "Gross product sales before fees" },
  { key: "shipping_credits", label: "Shipping credits", category: "Shipping Credits" },
  { key: "gift_wrap_credits", label: "Gift wrap credits", category: "Gift Wrap Credits" },
  { key: "reimbursements", label: "FBA reimbursements", category: "Reimbursements", hint: "Lost/damaged inventory paid back by Amazon" },
  { key: "other_income", label: "Other income", category: "Other Channel Income" },
];

export const EXPENSE_FIELDS = [
  { key: "refunds", label: "Refunds", category: "Refunds", hint: "Refunded product sales" },
  { key: "promotional_rebates", label: "Promotional rebates", category: "Promotions & Coupons", hint: "Coupons, deals, discounts" },
  { key: "selling_fees", label: "Selling fees", category: "Selling Fees", hint: "Referral fees" },
  { key: "fba_fees", label: "FBA fees", category: "FBA Fees", hint: "Fulfillment fees per unit" },
  { key: "storage_fees", label: "Storage fees", category: "Storage", hint: "Monthly + long-term / aged inventory" },
  { key: "inbound_fees", label: "Inbound placement / transportation", category: "Inbound Fees" },
  { key: "advertising_cost", label: "Cost of advertising", category: "Advertising", hint: "Sponsored Products / Brands / Display" },
  { key: "subscription_fees", label: "Subscription / service fees", category: "Subscription Fees" },
  { key: "other_transaction_fees", label: "Other transaction fees", category: "Other Transaction Fees" },
  { key: "other_expenses", label: "Other expenses", category: "Other Channel Expenses" },
];

export const CHANNEL_OPTIONS = ["Amazon", "TikTok Shop", "Shopify", "Walmart", "Other"];

const num = (v) => Number(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

export function computeTotals(report) {
  const total_income = round2(INCOME_FIELDS.reduce((s, f) => s + num(report[f.key]), 0));
  const total_expenses = round2(EXPENSE_FIELDS.reduce((s, f) => s + num(report[f.key]), 0));
  return { total_income, total_expenses, net_amount: round2(total_income - total_expenses) };
}

/** Do two date ranges overlap? */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Find an existing report for the same channel whose period overlaps this one. */
export function findOverlap(reports, draft, ignoreId) {
  if (!draft.channel || !draft.period_start || !draft.period_end) return null;
  return (
    reports.find(
      (r) =>
        r.id !== ignoreId &&
        r.channel === draft.channel &&
        overlaps(r.period_start, r.period_end, draft.period_start, draft.period_end)
    ) || null
  );
}

async function deleteLinkedLedger(report) {
  const ids = new Set(report?.ledger_transaction_ids || []);
  if (report?.id) {
    const linked = await base44.entities.LedgerTransaction.filter({ source_type: "channel_report", source_id: report.id });
    (linked || []).forEach((t) => ids.add(t.id));
  }
  for (const id of ids) {
    try {
      await base44.entities.LedgerTransaction.delete(id);
    } catch (_) {
      /* already gone */
    }
  }
}

/** One ledger line per non-zero field, all linked back to the report. */
async function postLedger(report, user) {
  const ids = [];
  const base = {
    date: report.period_end,
    period_start: report.period_start,
    period_end: report.period_end,
    department: "Sales Channels",
    counterparty: report.channel,
    counterparty_type: "other",
    sales_channel: report.channel,
    reference_number: `${report.channel} ${report.period_start} → ${report.period_end}`,
    source_type: "channel_report",
    source_id: report.id,
    created_by_name: user?.full_name || "",
  };
  for (const f of INCOME_FIELDS) {
    const amt = round2(num(report[f.key]));
    if (!amt) continue;
    const t = await base44.entities.LedgerTransaction.create({
      ...base,
      transaction_type: "revenue",
      category: f.category,
      description: `${report.channel} — ${f.label}`,
      quantity: f.key === "product_sales" ? num(report.units_sold) : 0,
      amount_in: amt,
      amount_out: 0,
    });
    ids.push(t.id);
  }
  for (const f of EXPENSE_FIELDS) {
    const amt = round2(num(report[f.key]));
    if (!amt) continue;
    const t = await base44.entities.LedgerTransaction.create({
      ...base,
      transaction_type: "expense",
      category: f.category,
      description: `${report.channel} — ${f.label}`,
      quantity: 0,
      amount_in: 0,
      amount_out: amt,
    });
    ids.push(t.id);
  }
  return ids;
}

/** Create or update a report and (re)post its ledger lines. */
export async function saveChannelReport(draft, existing, user) {
  const payload = { ...draft };
  [...INCOME_FIELDS, ...EXPENSE_FIELDS].forEach((f) => (payload[f.key] = round2(num(payload[f.key]))));
  ["units_sold", "orders_count", "deposited_amount", "marketplace_withheld_tax"].forEach(
    (k) => (payload[k] = num(payload[k]))
  );
  Object.assign(payload, computeTotals(payload));
  delete payload.id;
  delete payload.ledger_transaction_ids;

  let saved;
  if (existing?.id) {
    await deleteLinkedLedger(existing);
    saved = await base44.entities.ChannelReport.update(existing.id, payload);
    saved = { ...existing, ...payload, ...(saved || {}), id: existing.id };
  } else {
    saved = await base44.entities.ChannelReport.create({ ...payload, entered_by_name: user?.full_name || "" });
  }
  const ids = await postLedger(saved, user);
  await base44.entities.ChannelReport.update(saved.id, { ledger_transaction_ids: ids });
  return { ...saved, ledger_transaction_ids: ids };
}

export async function deleteChannelReport(report) {
  await deleteLinkedLedger(report);
  await base44.entities.ChannelReport.delete(report.id);
}
