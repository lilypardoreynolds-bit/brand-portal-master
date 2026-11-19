import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await base44.asServiceRole.entities.Invoice.list();
    const orders = await base44.asServiceRole.entities.Order.list();

    let syncedCount = 0;

    for (const invoice of invoices) {
      if (!invoice.order_id && !invoice.order_number) continue;

      let order = null;
      if (invoice.order_id) {
        order = orders.find(o => o.id === invoice.order_id);
      } else if (invoice.order_number) {
        order = orders.find(o => o.order_number === invoice.order_number);
      }

      if (!order) continue;

      const updateObj = { payment_status: invoice.payment_status };

      if (invoice.payment_status === "Paid" && invoice.payment_date) {
        const paymentDate = invoice.payment_date;
        const deadlineDate = new Date(paymentDate);
        deadlineDate.setDate(deadlineDate.getDate() + 3);
        
        updateObj.payment_date = paymentDate;
        updateObj.fulfillment_deadline = deadlineDate.toISOString().split("T")[0];
      }

      await base44.asServiceRole.entities.Order.update(order.id, updateObj);
      syncedCount++;
    }

    return Response.json({ 
      success: true, 
      message: `Synced ${syncedCount} orders with invoice payment status` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});