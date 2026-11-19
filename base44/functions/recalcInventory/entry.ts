import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Recalculates on_hand from movements AND reserved from pending orders.
// available = on_hand - reserved (always derived, never stored independently)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [inventory, movements, orders, orderItems] = await Promise.all([
      base44.entities.Inventory.list(),
      base44.entities.InventoryMovement.list('date'),
      base44.entities.Order.filter({ payment_status: 'Pending' }),
      base44.entities.OrderItem.list(),
    ]);

    // Build reserved map: product_id -> total reserved quantity from pending orders
    const pendingOrderIds = new Set(orders.map(o => o.id));
    const reservedByProduct = {};
    for (const item of orderItems) {
      if (pendingOrderIds.has(item.order_id)) {
        reservedByProduct[item.product_id] = (reservedByProduct[item.product_id] || 0) + (item.quantity || 0);
      }
    }

    const results = [];

    for (const inv of inventory) {
      // Recalculate on_hand from movements
      const invMovements = movements
        .filter(m => m.inventory_id === inv.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      let onHand = 0;
      for (const m of invMovements) {
        const qty = Number(m.quantity) || 0;
        if (m.movement_type === 'Inbound') onHand += qty;
        else if (m.movement_type === 'Outbound') onHand = Math.max(0, onHand - qty);
        else if (m.movement_type === 'Adjustment') onHand = qty;
        // Transfer, Sales Reserved, Sales Fulfilled etc. are handled by their own functions
      }

      // If no movements recorded, keep the current on_hand value
      if (invMovements.filter(m => ['Inbound','Outbound','Adjustment'].includes(m.movement_type)).length === 0) {
        onHand = inv.on_hand ?? inv.current_stock ?? 0;
      }

      // Reserved = sum of pending order quantities for this product
      const reserved = reservedByProduct[inv.product_id] || 0;

      // Available = on_hand - reserved (always derived)
      const available = Math.max(0, onHand - reserved);

      await base44.entities.Inventory.update(inv.id, {
        on_hand: onHand,
        current_stock: onHand,
        reserved,
        available,
        last_updated: new Date().toISOString().split('T')[0],
      });

      results.push({ product: inv.product_name, on_hand: onHand, reserved, available });
    }

    return Response.json({ message: 'Inventory recalculated', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});