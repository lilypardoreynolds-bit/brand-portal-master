import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data } = payload;

    // Only process when invoice is marked as Paid
    if (!data || data.payment_status !== 'Paid') {
      return Response.json({ skipped: true, reason: 'Invoice is not Paid' });
    }

    const invoice = data;
    const taxAmount = invoice.tax || 0;
    const revenue = invoice.subtotal || 0;
    const invoiceDate = invoice.invoice_date;

    if (!invoiceDate || taxAmount === 0) {
      return Response.json({ skipped: true, reason: 'No invoice date or no tax' });
    }

    // All shipments go to Orlando, Florida prep center
    const state = 'FL';

    // Calculate tax rate from subtotal and tax
    const taxRate = revenue > 0 ? parseFloat(((taxAmount / revenue) * 100).toFixed(4)) : 0;

    // Check if a SalesTaxEntry already exists for this invoice
    const existing = await base44.asServiceRole.entities.SalesTaxEntry.filter({
      order_id: invoice.invoice_number
    });

    const entryData = {
      order_id: invoice.invoice_number,
      order_date: invoiceDate,
      sales_channel: 'Direct Sales',
      customer_name: invoice.customer_name || '',
      state: state,
      product: `Sales Order ${invoice.order_number || ''}`,
      revenue: revenue,
      tax_rate: taxRate,
      tax_collected: taxAmount,
      tax_exempt: false,
      notes: `Auto-synced from Invoice #${invoice.invoice_number}`,
    };

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.SalesTaxEntry.update(existing[0].id, entryData);
      return Response.json({ updated: true, id: existing[0].id, invoice_number: invoice.invoice_number });
    } else {
      const created = await base44.asServiceRole.entities.SalesTaxEntry.create(entryData);
      return Response.json({ created: true, id: created.id, invoice_number: invoice.invoice_number });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});