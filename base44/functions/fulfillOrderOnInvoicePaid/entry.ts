import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Called when an Invoice is marked as Paid.
 * 1. Finds all OrderItems linked to the Invoice's order_id
 * 2. For each item: decrements on_hand, clears reserved, recalculates available
 * 3. Creates an Outbound InventoryMovement record
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { invoice_id } = body;
    if (!invoice_id) return Response.json({ error: 'Missing invoice_id' }, { status: 400 });

    const invoice = await base44.entities.Invoice.get(invoice_id);
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });
    if (!invoice.order_id) return Response.json({ success: true, message: 'No order linked to invoice' });

    const order = await base44.entities.Order.get(invoice.order_id);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    const orderItems = await base44.entities.OrderItem.filter({ order_id: order.id });
    if (orderItems.length === 0) return Response.json({ success: true, message: 'No items to fulfill' });

    const inventory = await base44.entities.Inventory.list();
    const today = new Date().toISOString().split('T')[0];

    for (const item of orderItems) {
      if (!item.product_id || !item.quantity) continue;

      const inv = inventory.find(i => i.product_id === item.product_id);
      if (!inv) continue;

      const qty = item.quantity;
      const onHand = inv.on_hand ?? inv.current_stock ?? 0;
      const reserved = inv.reserved ?? 0;

      // Decrement on_hand by qty sold, clear the reservation for this item
      const newOnHand = Math.max(0, onHand - qty);
      const newReserved = Math.max(0, reserved - qty);
      const newAvailable = Math.max(0, newOnHand - newReserved);

      await base44.entities.Inventory.update(inv.id, {
        on_hand: newOnHand,
        current_stock: newOnHand,
        reserved: newReserved,
        available: newAvailable,
        last_updated: today,
      });

      await base44.entities.InventoryMovement.create({
        inventory_id: inv.id,
        product_id: item.product_id,
        product_name: inv.product_name,
        movement_type: 'Outbound',
        quantity: qty,
        date: today,
        reference: order.order_number || '',
        label: 'Order Fulfilled',
        notes: `Invoice ${invoice.invoice_number} paid — Order ${order.order_number} fulfilled`,
      });
    }

    return Response.json({ success: true, message: `Fulfilled order ${order.order_number}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});