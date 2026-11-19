import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { po_id, po_number, received_items } = await req.json();

    if (!po_id || !received_items) {
      return Response.json({ error: 'po_id and received_items required' }, { status: 400 });
    }

    const po = await base44.asServiceRole.entities.PurchaseOrder.read(po_id);
    if (!po) {
      return Response.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const movements = [];

    // Process each received item
    for (const receivedItem of received_items) {
      const inventory = await base44.asServiceRole.entities.Inventory.filter({ 
        product_id: receivedItem.product_id 
      });

      let inv;
      if (inventory && inventory.length > 0) {
        inv = inventory[0];
      } else {
        // Create new inventory record if not exists
        inv = await base44.asServiceRole.entities.Inventory.create({
          product_id: receivedItem.product_id,
          product_name: receivedItem.product_name,
          on_hand: 0,
          reserved: 0,
          available: 0,
          warehouse: 'Own Warehouse',
          warehouse_location: ''
        });
      }

      const prevOnHand = inv.on_hand || 0;
      const prevReserved = inv.reserved || 0;
      const prevAvailable = inv.available || 0;

      // Increase On Hand by received quantity
      const newOnHand = prevOnHand + receivedItem.received_quantity;
      
      // Reserved stays the same
      const newReserved = prevReserved;
      
      // Recalculate Available
      const newAvailable = newOnHand - newReserved;

      await base44.asServiceRole.entities.Inventory.update(inv.id, {
        on_hand: newOnHand,
        reserved: newReserved,
        available: newAvailable
      });

      // Log movement
      movements.push({
        date: new Date().toISOString().split('T')[0],
        product_id: receivedItem.product_id,
        product_name: receivedItem.product_name,
        inventory_id: inv.id,
        movement_type: 'Inbound',
        quantity: receivedItem.received_quantity,
        reference: po_number,
        label: 'PO Received',
        from_warehouse: inv.warehouse,
        notes: `Received from PO ${po_number}`
      });
    }

    // Create movement records
    if (movements.length > 0) {
      await base44.asServiceRole.entities.InventoryMovement.bulkCreate(movements);
    }

    return Response.json({ 
      success: true,
      message: `Received ${received_items.length} products from PO ${po_number}`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});