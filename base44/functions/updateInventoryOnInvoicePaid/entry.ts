import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();

    // Only process if invoice status is Paid
    if (data.payment_status !== 'Paid') {
      return Response.json({ message: 'Not a paid invoice, skipping' });
    }

    if (!data.order_id) {
      return Response.json({ message: 'No order linked to invoice' });
    }

    const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: data.order_id });

    await Promise.all(items.map(async (item) => {
      if (!item.product_id || !item.quantity) return;

      const invRecords = await base44.asServiceRole.entities.Inventory.filter({ product_id: item.product_id });
      if (invRecords.length === 0) return;

      const inv = invRecords[0];
      const onHand = inv.on_hand ?? inv.current_stock ?? 0;
      const qty = item.quantity || 0;

      // Decrease on_hand by quantity sold
      const newOnHand = Math.max(0, onHand - qty);
      // reserved stays as-is (not using reservation workflow)
      const reserved = inv.reserved ?? 0;
      const newAvailable = Math.max(0, newOnHand - reserved);

      // Create outbound movement record
      await base44.asServiceRole.entities.InventoryMovement.create({
        date: new Date().toISOString().split('T')[0],
        product_id: item.product_id,
        product_name: inv.product_name,
        inventory_id: inv.id,
        movement_type: 'Outbound',
        quantity: qty,
        label: 'Order Fulfilled',
        reference: data.order_number || data.order_id,
        notes: `Invoice ${data.invoice_number} paid - Order ${data.order_number || data.order_id} fulfilled`,
      });

      // Update inventory
      await base44.asServiceRole.entities.Inventory.update(inv.id, {
        on_hand: newOnHand,
        current_stock: newOnHand,
        available: newAvailable,
        last_updated: new Date().toISOString().split('T')[0],
      });
    }));

    return Response.json({ message: 'Inventory updated successfully', items_processed: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});