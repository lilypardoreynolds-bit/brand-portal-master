import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { product_id, product_name, quantity, date, reason, department, notes, campaign } = body;

    if (!product_id || !quantity || !date || !reason || !department) {
      return Response.json({ error: 'Missing required fields: product_id, quantity, date, reason, department' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (qty <= 0) return Response.json({ error: 'Quantity must be greater than zero' }, { status: 400 });

    // 1. Find inventory record(s) for this product — pick the one with most available stock
    const inventoryRecords = await base44.asServiceRole.entities.Inventory.filter({ product_id });
    if (!inventoryRecords || inventoryRecords.length === 0) {
      return Response.json({ error: 'No inventory found for this product' }, { status: 404 });
    }

    const withStock = inventoryRecords
      .map(i => ({ ...i, _available: Math.max(0, (i.on_hand ?? 0) - (i.reserved ?? 0)) }))
      .sort((a, b) => b._available - a._available);
    const invItem = withStock[0];

    if (!invItem || (invItem.on_hand ?? 0) < qty) {
      return Response.json({ error: `Insufficient stock. Available: ${invItem?._available ?? 0}` }, { status: 400 });
    }

    // 2. Calculate landed unit cost (weighted average from POs + Cost Centers + manual LedgerTransactions)
    let totalInvestment = 0;
    let totalUnitsPurchased = 0;

    // Purchase Orders
    const allPOs = await base44.asServiceRole.entities.PurchaseOrder.list(null, 500);
    (allPOs || []).forEach(po => {
      if (po.status === 'Draft' || po.status === 'Cancelled') return;
      const items = po.line_items || [];
      const poItemTotal = items.reduce((s, l) => s + (l.quantity || 0) * (l.unit_price || 0), 0) || 1;
      items.forEach(li => {
        if (li.product_id && li.product_id !== product_id) return;
        if (!li.product_id && !po.product_id) return;
        const liQty = li.quantity || 0;
        const liUnit = li.unit_price || 0;
        const lineTotal = liQty * liUnit;
        const share = poItemTotal > 0 ? lineTotal / poItemTotal : 0;
        totalInvestment += lineTotal;
        totalInvestment += (po.shipping_cost || 0) * share;
        totalInvestment += (po.import_duties || 0) * share;
        totalInvestment += (po.other_fees || 0) * share;
        totalUnitsPurchased += liQty;
      });
    });

    // Cost Center entries
    const ccEntries = await base44.asServiceRole.entities.CostCenter.filter({ product_id });
    (ccEntries || []).forEach(e => { totalInvestment += e.amount || 0; });

    // Manual LedgerTransactions with type "investment"
    const ledgerInvestments = await base44.asServiceRole.entities.LedgerTransaction.filter({ product_id, transaction_type: 'investment' });
    (ledgerInvestments || []).forEach(t => {
      totalInvestment += (t.amount_out ?? t.amount) || 0;
      totalUnitsPurchased += t.quantity || 0;
    });

    let landedUnitCost = totalUnitsPurchased > 0 ? totalInvestment / totalUnitsPurchased : (invItem.unit_cost || 0);
    if (landedUnitCost === 0) {
      // Fallback to Product cost fields
      const product = await base44.asServiceRole.entities.Product.get(product_id);
      if (product) {
        landedUnitCost = (product.manufacturing_cost || 0) + (product.packaging_cost || 0) +
          (product.shipping_cost || 0) + (product.import_duties_cost || 0) +
          (product.fulfillment_cost || 0) + (product.storage_cost || 0) + (product.other_costs || 0);
      }
    }

    const totalCost = qty * landedUnitCost;
    const resolvedProductName = product_name || invItem.product_name || '';

    // 3. Reduce inventory
    const newOnHand = Math.max(0, (invItem.on_hand ?? 0) - qty);
    const reserved = invItem.reserved ?? 0;
    const newAvailable = Math.max(0, newOnHand - reserved);
    await base44.asServiceRole.entities.Inventory.update(invItem.id, {
      on_hand: newOnHand,
      current_stock: newOnHand,
      available: newAvailable,
      last_updated: date,
    });

    // 4. Create InventoryMovement for traceability
    await base44.asServiceRole.entities.InventoryMovement.create({
      date,
      product_id,
      product_name: resolvedProductName,
      inventory_id: invItem.id,
      movement_type: 'Outbound',
      quantity: qty,
      label: reason,
      reference: campaign || '',
      notes: `Consumption — ${reason} — ${department}${notes ? ' — ' + notes : ''}`,
    });

    // 5. Create LedgerTransaction (expense) linked to department
    const ledgerEntry = await base44.asServiceRole.entities.LedgerTransaction.create({
      product_id,
      product_name: resolvedProductName,
      date,
      description: `Inventory Consumption — ${reason}`,
      transaction_type: 'expense',
      category: reason,
      department,
      counterparty: department,
      counterparty_type: 'other',
      reference_number: campaign || '',
      quantity: qty,
      unit_cost: landedUnitCost,
      amount_in: 0,
      amount_out: totalCost,
      source_type: 'consumption',
      created_by_name: user?.full_name || '',
      notes: `Dept: ${department}${campaign ? ' | Campaign: ' + campaign : ''}${notes ? ' | ' + notes : ''}`,
    });

    // 6. Create InventoryConsumption record
    const consumption = await base44.asServiceRole.entities.InventoryConsumption.create({
      product_id,
      product_name: resolvedProductName,
      inventory_id: invItem.id,
      warehouse: invItem.warehouse || 'Own Warehouse',
      quantity: qty,
      date,
      reason,
      department,
      notes: notes || '',
      related_campaign: campaign || '',
      landed_unit_cost: landedUnitCost,
      total_value: totalCost,
      total_cost_with_shipping: totalCost,
      ledger_transaction_ids: [ledgerEntry.id],
      created_by_name: user?.full_name || '',
    });

    return Response.json({
      success: true,
      consumption,
      landedUnitCost,
      totalCost,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
