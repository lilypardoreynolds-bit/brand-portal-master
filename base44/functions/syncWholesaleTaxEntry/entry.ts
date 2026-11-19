import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process when invoice is marked as Paid
    if (!data || data.status !== 'Paid') {
      return Response.json({ skipped: true, reason: 'Invoice is not Paid' });
    }

    const invoice = data;

    // Skip if no tax (tax_exempt or tax_amount is 0)
    if (invoice.tax_exempt) {
      return Response.json({ skipped: true, reason: 'Invoice is tax exempt' });
    }

    const taxAmount = invoice.tax_amount || 0;
    const revenue = invoice.subtotal || 0;
    const invoiceDate = invoice.invoice_date;

    if (!invoiceDate) {
      return Response.json({ skipped: true, reason: 'No invoice date' });
    }

    // Check if a SalesTaxEntry already exists for this invoice
    const existing = await base44.asServiceRole.entities.SalesTaxEntry.filter({
      order_id: invoice.invoice_number
    });

    const entryData = {
      order_id: invoice.invoice_number,
      order_date: invoiceDate,
      sales_channel: 'Wholesale',
      customer_name: invoice.customer_name || '',
      state: 'FL', // All shipments go to Orlando, Florida prep center
      product: 'Wholesale Order',
      revenue: revenue,
      tax_rate: invoice.tax_rate || 0,
      tax_collected: taxAmount,
      tax_exempt: false,
      resale_certificate_number: invoice.resale_certificate_number || '',
      notes: `Auto-synced from Wholesale Invoice #${invoice.invoice_number}`,
    };

    if (existing && existing.length > 0) {
      // Update existing entry with latest values
      await base44.asServiceRole.entities.SalesTaxEntry.update(existing[0].id, entryData);
      return Response.json({ updated: true, id: existing[0].id, invoice_number: invoice.invoice_number });
    } else {
      // Create new entry
      const created = await base44.asServiceRole.entities.SalesTaxEntry.create(entryData);
      return Response.json({ created: true, id: created.id, invoice_number: invoice.invoice_number });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});