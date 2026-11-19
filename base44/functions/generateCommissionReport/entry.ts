import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Determine which month to generate for (default: previous month, or pass month/year)
    let body = {};
    try { body = await req.json(); } catch (_) {}

    const now = new Date();
    const targetYear = body.year ?? (body.month === undefined ? now.getFullYear() : body.year ?? now.getFullYear());
    const targetMonth = body.month ?? (now.getMonth() === 0 ? 11 : now.getMonth() - 1); // default: last month
    const targetYearAdj = (body.month === undefined && now.getMonth() === 0) ? targetYear - 1 : targetYear;

    const periodStart = new Date(targetYearAdj, targetMonth, 1);
    const periodEnd = new Date(targetYearAdj, targetMonth + 1, 0); // last day of month

    const periodStartStr = periodStart.toISOString().split('T')[0];
    const periodEndStr = periodEnd.toISOString().split('T')[0];

    const reportingPeriod = periodStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Fetch all paid invoices
    const [invoices, wholesaleInvoices, settings] = await Promise.all([
      base44.asServiceRole.entities.Invoice.filter({ payment_status: 'Paid' }),
      base44.asServiceRole.entities.WholesaleInvoice.filter({ status: 'Paid' }),
      base44.asServiceRole.entities.CommissionSettings.list(),
    ]);

    const commissionRate = settings[0]?.commission_rate || 15;
    const paymentDay = settings[0]?.payment_day || 10;

    const isInPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= periodStart && d <= periodEnd;
    };

    const directSales = invoices
      .filter((inv) => isInPeriod(inv.invoice_date))
      .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

    const wholesaleSales = wholesaleInvoices
      .filter((inv) => isInPeriod(inv.invoice_date))
      .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

    const totalGrossSales = directSales + wholesaleSales;
    const totalCommissionDue = (totalGrossSales * commissionRate) / 100;

    // Payment due: day 10 of the following month
    const paymentDueDate = new Date(targetYearAdj, targetMonth + 1, 10);
    const paymentDueDateStr = paymentDueDate.toISOString().split('T')[0];

    // Check if report already exists for this period
    const existing = await base44.asServiceRole.entities.CommissionReport.filter({
      period_start: periodStartStr
    });

    const reportData = {
      reporting_period: reportingPeriod,
      period_start: periodStartStr,
      period_end: periodEndStr,
      total_gross_sales: totalGrossSales,
      commission_rate: commissionRate,
      total_commission_due: totalCommissionDue,
      payment_due_date: paymentDueDateStr,
      status: 'Generated',
      notes: `Direct Sales: $${directSales.toFixed(2)} | Wholesale: $${wholesaleSales.toFixed(2)}`,
    };

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.CommissionReport.update(existing[0].id, reportData);
      return Response.json({ updated: true, period: reportingPeriod, gross_sales: totalGrossSales, commission: totalCommissionDue });
    } else {
      const created = await base44.asServiceRole.entities.CommissionReport.create(reportData);
      return Response.json({ created: true, id: created.id, period: reportingPeriod, gross_sales: totalGrossSales, commission: totalCommissionDue });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});