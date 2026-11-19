import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const today = () => new Date().toISOString().split('T')[0];

// Marketing allocations (Amazon Vine, samples, influencers).
// Creating one reserves sellable stock and books a Marketing expense.
// It never creates a sale or revenue record.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'create') {
      const quantity = Number(body.quantity);
      const program = body.program;
      if (!body.inventory_id) return Response.json({ error: 'inventory_id is required' }, { status: 400 });
      if (!quantity || quantity <= 0) return Response.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
      if (!program) return Response.json({ error: 'Program is required' }, { status: 400 });

      const inv = await base44.entities.Inventory.get(body.inventory_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!inv) return Response.json({ error: 'Inventory row not found' }, { status: 404 });

      const onHand = inv.on_hand ?? inv.current_stock ?? 0;
      const reserved = inv.reserved ?? 0;
      const sellable = Math.max(0, onHand - reserved);
      const warehouse = inv.warehouse || 'Own Warehouse';
      if (quantity > sellable) {
        return Response.json({ error: `Only ${sellable} sellable units of ${inv.product_name} in ${warehouse}` }, { status: 400 });
      }

      const unitCost = Number(inv.unit_cost) || 0;
      const productCost = Math.round(quantity * unitCost * 100) / 100;
      const shippingCost = Math.round((Number(body.shipping_cost) || 0) * 100) / 100;
      if (shippingCost < 0) return Response.json({ error: 'Shipping cost cannot be negative' }, { status: 400 });
      const totalCost = Math.round((productCost + shippingCost) * 100) / 100;
      const date = body.date || today();

      // 1. Reserve the units so they are no longer sellable
      await base44.entities.Inventory.update(inv.id, {
        reserved: reserved + quantity,
        available: Math.max(0, onHand - (reserved + quantity)),
        last_updated: date,
      });

      // 2. Book the marketing cost (never a sale)
      const expense = await base44.entities.Expense.create({
        date,
        expense_name: `Marketing allocation - ${program}: ${inv.product_name}`,
        category: 'Marketing',
        vendor: program,
        amount: totalCost,
        expense_type: 'Variable',
        payment_status: 'Paid',
        notes: `Product $${productCost.toFixed(2)} + Shipping $${shippingCost.toFixed(2)} = $${totalCost.toFixed(2)}. ${quantity} unit(s) allocated from ${warehouse} at $${unitCost} unit cost. Marketing cost, no revenue.`,
      });

      // 3. Record the allocation
      const allocation = await base44.entities.MarketingAllocation.create({
        product_id: inv.product_id || '',
        product_name: inv.product_name,
        inventory_id: inv.id,
        warehouse,
        quantity,
        program,
        date,
        status: body.status || 'Allocated',
        unit_cost: unitCost,
        product_cost: productCost,
        shipping_cost: shippingCost,
        total_cost: totalCost,
        expense_id: expense.id,
        notes: body.notes || '',
      });

      return Response.json({ allocation, expense });
    }

    if (action === 'delete') {
      if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
      const allocation = await base44.entities.MarketingAllocation.get(body.id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!allocation) return Response.json({ error: 'Allocation not found' }, { status: 404 });

      const inv = await base44.entities.Inventory.get(allocation.inventory_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (inv) {
        const onHand = inv.on_hand ?? inv.current_stock ?? 0;
        const reserved = Math.max(0, (inv.reserved ?? 0) - (allocation.quantity || 0));
        await base44.entities.Inventory.update(inv.id, {
          reserved,
          available: Math.max(0, onHand - reserved),
          last_updated: today(),
        });
      }

      if (allocation.expense_id) {
        await base44.entities.Expense.delete(allocation.expense_id).catch(() => null);
      }

      await base44.entities.MarketingAllocation.delete(allocation.id);
      return Response.json({ deleted: allocation.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
