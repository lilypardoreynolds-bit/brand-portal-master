import { base44 } from "@/api/base44Client";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Takes stock out of inventory for a non-sale reason (samples, creators, giveaways, damage...)
 * and records the cost in the ledger:
 *   1. reduces on_hand on the inventory record
 *   2. product cost (qty x landed unit cost) -> ledger expense, category = reason
 *   3. shipping cost (if any) -> separate ledger expense, category "Sample Shipping"
 *   4. outbound InventoryMovement for traceability
 *   5. InventoryConsumption record linking everything
 *
 * form: { inventory_id, product_id, product_name, sku, warehouse, quantity, date, reason,
 *         department, related_campaign, landed_unit_cost, shipping_cost, source_channel,
 *         creator_name, creator_handle, influencer_id, order_reference, tracking_number, notes }
 */
export async function recordConsumption(form, inventory, user) {
  const invItem = inventory.find((i) => i.id === form.inventory_id);
  if (!invItem) throw new Error("Inventory item not found");

  const qty = Number(form.quantity) || 0;
  if (qty <= 0) throw new Error("Quantity must be greater than zero");
  const onHand = invItem.on_hand ?? invItem.current_stock ?? 0;
  if (qty > onHand) throw new Error(`Only ${onHand} units on hand in ${invItem.warehouse || "Own Warehouse"}`);

  const date = form.date || new Date().toISOString().split("T")[0];
  const unitCost = Number(form.landed_unit_cost) || 0;
  const productCost = round2(qty * unitCost);
  const shipping = round2(form.shipping_cost);
  const department = form.department || "Marketing";
  const who = user?.full_name || "";

  const contextBits = [
    form.source_channel && `Source: ${form.source_channel}`,
    form.creator_name && `Creator: ${form.creator_name}${form.creator_handle ? ` (${form.creator_handle})` : ""}`,
    form.related_campaign && `Campaign: ${form.related_campaign}`,
    form.order_reference && `Order: ${form.order_reference}`,
  ].filter(Boolean);
  const context = contextBits.join(" | ");

  // 1. Reduce stock
  const newOnHand = Math.max(0, onHand - qty);
  const reserved = invItem.reserved ?? 0;
  await base44.entities.Inventory.update(invItem.id, {
    on_hand: newOnHand,
    current_stock: newOnHand,
    available: Math.max(0, newOnHand - reserved),
    last_updated: date,
  });

  // 2. Product cost -> ledger
  const ledgerIds = [];
  const common = {
    product_id: form.product_id || invItem.product_id,
    product_name: form.product_name || invItem.product_name,
    sku: form.sku || invItem.sku || "",
    date,
    transaction_type: "expense",
    department,
    counterparty: form.creator_name || "",
    counterparty_type: "other",
    reference_number: form.order_reference || "",
    amount_in: 0,
    sales_channel: form.source_channel || "",
    source_type: form.source_channel === "Trybe" ? "sample_shipment" : "consumption",
    created_by_name: who,
  };

  const productTxn = await base44.entities.LedgerTransaction.create({
    ...common,
    category: form.reason,
    description: `Inventory Consumption — ${form.reason} (${department})${context ? ` | ${context}` : ""}`,
    quantity: qty,
    unit_cost: unitCost,
    amount_out: productCost,
    notes: form.notes || "",
  });
  ledgerIds.push(productTxn.id);

  // 3. Shipping -> ledger (same department, so samples show their full cost in Marketing)
  if (shipping > 0) {
    const shipTxn = await base44.entities.LedgerTransaction.create({
      ...common,
      category: "Sample Shipping",
      description: `Shipping — ${form.reason}${context ? ` | ${context}` : ""}`,
      quantity: 0,
      unit_cost: 0,
      amount_out: shipping,
      notes: form.tracking_number ? `Tracking: ${form.tracking_number}` : "",
    });
    ledgerIds.push(shipTxn.id);
  }

  // 4. Movement
  const movement = await base44.entities.InventoryMovement.create({
    date,
    product_id: common.product_id || invItem.id,
    product_name: common.product_name,
    inventory_id: invItem.id,
    movement_type: "Outbound",
    from_warehouse: invItem.warehouse || "Own Warehouse",
    quantity: qty,
    shipping_cost: shipping,
    label: form.reason,
    reference: form.order_reference || `Consumption — ${form.reason}`,
    notes: [form.reason, `Dept: ${department}`, context, form.notes].filter(Boolean).join(" | "),
  });

  // 5. Consumption record
  const consumption = await base44.entities.InventoryConsumption.create({
    product_id: common.product_id,
    product_name: common.product_name,
    sku: common.sku,
    warehouse: invItem.warehouse || "Own Warehouse",
    quantity: qty,
    date,
    reason: form.reason,
    department,
    related_campaign: form.related_campaign || "",
    landed_unit_cost: unitCost,
    total_value: productCost,
    shipping_cost: shipping,
    total_cost_with_shipping: round2(productCost + shipping),
    source_channel: form.source_channel || "Manual",
    creator_name: form.creator_name || "",
    creator_handle: form.creator_handle || "",
    influencer_id: form.influencer_id || "",
    order_reference: form.order_reference || "",
    tracking_number: form.tracking_number || "",
    ledger_transaction_ids: ledgerIds,
    movement_id: movement.id,
    notes: form.notes || "",
    created_by_name: who,
  });

  return { consumption, productCost, shipping, total: round2(productCost + shipping) };
}
