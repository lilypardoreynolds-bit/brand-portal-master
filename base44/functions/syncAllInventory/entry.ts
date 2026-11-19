import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    let syncedOrders = 0;
    let syncedPOs = 0;
    const errors = [];

    // Reset all inventory to On Hand only (clear Reserved)
    const allInventory = await base44.asServiceRole.entities.Inventory.list();
    for (const inv of allInventory) {
      await base44.asServiceRole.entities.Inventory.update(inv.id, {
        reserved: 0,
        available: inv.on_hand || 0
      });
    }

    // Process all Sales Orders
    const allOrders = await base44.asServiceRole.entities.Order.list();
    for (const order of allOrders) {
      try {
        const orderItems = await base44.asServiceRole.entities.OrderItem.filter({ 
          order_id: order.id 
        });

        if (!orderItems || orderItems.length === 0) continue;

        // Check order status
        const isPending = ['Pending', 'Processing', 'Open', 'Awaiting Payment'].includes(order.order_status);
        const isPaid = ['Paid'].includes(order.payment_status);
        const isCancelled = order.order_status === 'Cancelled';

        for (const item of orderItems) {
          const inventory = await base44.asServiceRole.entities.Inventory.filter({ 
            product_id: item.product_id 
          });

          if (!inventory || inventory.length === 0) continue;

          const inv = inventory[0];

          if (isCancelled) {
            // Do nothing - cancelled orders don't change inventory
            continue;
          }

          if (isPaid) {
            // Order is paid - reduce On Hand and Reserved
            const newOnHand = Math.max(0, (inv.on_hand || 0) - item.quantity);
            const newReserved = Math.max(0, (inv.reserved || 0) - item.quantity);
            const newAvailable = newOnHand - newReserved;

            await base44.asServiceRole.entities.Inventory.update(inv.id, {
              on_hand: newOnHand,
              reserved: newReserved,
              available: newAvailable
            });
          } else if (isPending) {
            // Order is pending - reserve inventory
            const newReserved = (inv.reserved || 0) + item.quantity;
            const newAvailable = (inv.on_hand || 0) - newReserved;

            await base44.asServiceRole.entities.Inventory.update(inv.id, {
              reserved: newReserved,
              available: newAvailable
            });
          }
        }

        syncedOrders++;
      } catch (error) {
        errors.push(`Order ${order.order_number}: ${error.message}`);
      }
    }

    // Process all Purchase Orders
    const allPOs = await base44.asServiceRole.entities.PurchaseOrder.list();
    for (const po of allPOs) {
      try {
        const isDelivered = ['Delivered', 'Received'].includes(po.status);

        if (!isDelivered) continue;

        const lineItems = po.line_items || [];
        if (lineItems.length === 0) continue;

        for (const item of lineItems) {
          const inventory = await base44.asServiceRole.entities.Inventory.filter({ 
            product_id: item.product_id 
          });

          if (!inventory || inventory.length === 0) continue;

          const inv = inventory[0];

          // Add to On Hand (assuming full quantity was received)
          const newOnHand = (inv.on_hand || 0) + item.quantity;
          const newReserved = inv.reserved || 0;
          const newAvailable = newOnHand - newReserved;

          await base44.asServiceRole.entities.Inventory.update(inv.id, {
            on_hand: newOnHand,
            reserved: newReserved,
            available: newAvailable
          });
        }

        syncedPOs++;
      } catch (error) {
        errors.push(`PO ${po.po_number}: ${error.message}`);
      }
    }

    return Response.json({ 
      success: true,
      message: `Synced ${syncedOrders} orders and ${syncedPOs} purchase orders`,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});