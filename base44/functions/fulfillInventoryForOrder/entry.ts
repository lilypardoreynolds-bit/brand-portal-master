import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, order_number } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id required' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.read(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const orderItems = await base44.asServiceRole.entities.OrderItem.filter({ order_id });
    if (!orderItems || orderItems.length === 0) {
      return Response.json({ error: 'No items in order' }, { status: 400 });
    }

    const movements = [];

    // Fulfill (reduce On Hand and Reserved)
    for (const item of orderItems) {
      const inventory = await base44.asServiceRole.entities.Inventory.filter({ 
        product_id: item.product_id 
      });

      if (!inventory || inventory.length === 0) {
        continue;
      }

      const inv = inventory[0];
      const prevOnHand = inv.on_hand || 0;
      const prevReserved = inv.reserved || 0;
      const prevAvailable = inv.available || 0;

      // Reduce On Hand by the quantity (item physically leaves)
      const newOnHand = Math.max(0, prevOnHand - item.quantity);

      // Reduce Reserved by the quantity (reservation is consumed)
      const newReserved = Math.max(0, prevReserved - item.quantity);

      // Available = on_hand - reserved (always derived)
      const newAvailable = Math.max(0, newOnHand - newReserved);

      await base44.asServiceRole.entities.Inventory.update(inv.id, {
        on_hand: newOnHand,
        reserved: newReserved,
        available: newAvailable
      });

      // Log movement
      movements.push({
        date: new Date().toISOString().split('T')[0],
        product_id: item.product_id,
        product_name: item.product_name,
        inventory_id: inv.id,
        movement_type: 'Sales Fulfilled',
        quantity: item.quantity,
        reference: order_number,
        label: 'Sales Fulfilled',
        from_warehouse: inv.warehouse,
        notes: `Fulfilled for order ${order_number}`
      });
    }

    // Create movement records
    if (movements.length > 0) {
      await base44.asServiceRole.entities.InventoryMovement.bulkCreate(movements);
    }

    return Response.json({ 
      success: true,
      message: `Fulfilled ${orderItems.length} products for order ${order_number}`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});