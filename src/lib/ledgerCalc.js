export const DEFAULT_CATEGORIES = [
  { name: "Product Purchase", type: "investment", color: "#78AF86" },
  { name: "Packaging", type: "investment", color: "#5a9b6c" },
  { name: "Custom Box", type: "investment", color: "#5a9b6c" },
  { name: "Labels", type: "investment", color: "#5a9b6c" },
  { name: "Inserts", type: "investment", color: "#5a9b6c" },
  { name: "Manufacturing", type: "investment", color: "#5a9b6c" },
  { name: "Freight", type: "investment", color: "#4a8c5e" },
  { name: "Ocean Freight", type: "investment", color: "#4a8c5e" },
  { name: "Air Freight", type: "investment", color: "#4a8c5e" },
  { name: "Customs", type: "investment", color: "#4a8c5e" },
  { name: "Import Duties", type: "investment", color: "#4a8c5e" },
  { name: "Prep Center", type: "investment", color: "#4a8c5e" },
  { name: "Inspection", type: "investment", color: "#4a8c5e" },
  { name: "Assembly", type: "investment", color: "#4a8c5e" },
  { name: "Samples", type: "investment", color: "#4a8c5e" },
  { name: "FBA Fees", type: "expense", color: "#c9755a" },
  { name: "FBM Shipping", type: "expense", color: "#c9755a" },
  { name: "Storage", type: "expense", color: "#c9755a" },
  { name: "Photography", type: "expense", color: "#c9755a" },
  { name: "Marketing", type: "expense", color: "#c9755a" },
  { name: "Advertising", type: "expense", color: "#c9755a" },
  { name: "Returns", type: "expense", color: "#c9755a" },
  { name: "Refunds", type: "expense", color: "#c9755a" },
  { name: "Repairs", type: "expense", color: "#c9755a" },
  { name: "Miscellaneous", type: "expense", color: "#94a3b8" },
  { name: "Product Sale", type: "revenue", color: "#3b82f6" },
];

export const TX_TYPE_LABELS = {
  investment: "Investment",
  expense: "Expense",
  revenue: "Revenue",
  adjustment: "Adjustment",
};

export const TX_TYPE_COLORS = {
  investment: "bg-emerald-100 text-emerald-700",
  expense: "bg-amber-100 text-amber-700",
  revenue: "bg-blue-100 text-blue-700",
  adjustment: "bg-slate-100 text-slate-700",
};

/** Returns the magnitude of a transaction allocated to a given product. */
export function txnAmountForProduct(txn, productId) {
  if (txn.allocations && txn.allocations.length > 0) {
    const alloc = txn.allocations.find((a) => a.product_id === productId);
    if (alloc) return alloc.amount || 0;
    return 0;
  }
  return (txn.amount_in || 0) + (txn.amount_out || 0);
}

export function txnQtyForProduct(txn, productId) {
  if (txn.allocations && txn.allocations.length > 0) {
    const alloc = txn.allocations.find((a) => a.product_id === productId);
    if (alloc) return alloc.quantity || 0;
    return 0;
  }
  return txn.quantity || 0;
}

function matchCategory(cat, keywords) {
  const c = (cat || "").toLowerCase();
  return keywords.some((k) => c.includes(k));
}

export function computeKPIs(transactions, productId) {
  let investment = 0,
    revenue = 0,
    expenses = 0,
    unitsPurchased = 0,
    unitsSold = 0;
  const landed = { base: 0, packaging: 0, labels: 0, inserts: 0, freight: 0, customs: 0, prep: 0, assembly: 0, other: 0 };

  for (const txn of transactions) {
    const amt = txnAmountForProduct(txn, productId);
    const qty = txnQtyForProduct(txn, productId);
    const cat = (txn.category || "").toLowerCase();

    if (txn.transaction_type === "investment") {
      investment += amt;
      unitsPurchased += qty;
      if (cat.includes("purchase") || cat.includes("manufacturing") || cat === "samples") landed.base += amt;
      else if (cat.includes("packaging") || cat.includes("custom box")) landed.packaging += amt;
      else if (cat.includes("label")) landed.labels += amt;
      else if (cat.includes("insert")) landed.inserts += amt;
      else if (cat.includes("freight")) landed.freight += amt;
      else if (cat.includes("customs") || cat.includes("duties")) landed.customs += amt;
      else if (cat.includes("prep")) landed.prep += amt;
      else if (cat.includes("assembly")) landed.assembly += amt;
      else landed.other += amt;
    } else if (txn.transaction_type === "revenue") {
      revenue += amt;
      unitsSold += qty;
    } else if (txn.transaction_type === "expense") {
      expenses += amt;
    }
  }

  const grossProfit = revenue - investment;
  const netProfit = revenue - investment - expenses;
  const unitsRemaining = unitsPurchased - unitsSold;
  const avgCostPerUnit = unitsPurchased > 0 ? investment / unitsPurchased : 0;
  const breakdown = computeLandedCostBreakdown(transactions, productId);
  const landedCost = breakdown.totalLandedCost;
  const landedCostPerUnit = breakdown.landedUnitCost;
  const inventoryValue = unitsRemaining * landedCostPerUnit;
  const roi = investment > 0 ? (netProfit / investment) * 100 : 0;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const breakEvenPrice = unitsSold > 0 ? investment / unitsSold : avgCostPerUnit;
  const remainingToRecover = Math.max(0, investment + expenses - revenue);

  return {
    investment,
    revenue,
    expenses,
    grossProfit,
    netProfit,
    inventoryValue,
    avgCostPerUnit,
    landedCost,
    landedCostPerUnit,
    unitsPurchased,
    unitsSold,
    unitsRemaining,
    roi,
    profitMargin,
    breakEvenPrice,
    remainingToRecover,
    landed,
  };
}

/** Convert PurchaseOrders into virtual ledger transactions for a given product. */
export function poToLedgerTransactions(purchaseOrders, productId) {
  const result = [];
  for (const po of purchaseOrders) {
    if (po.status === "Draft" || po.status === "Cancelled") continue;

    let lineItem = null;
    let totalLineValue = 0;

    if (po.line_items && po.line_items.length > 0) {
      lineItem = po.line_items.find((li) => li.product_id === productId);
      totalLineValue = po.line_items.reduce((s, li) => s + (li.quantity || 0) * (li.unit_price || 0), 0);
    } else if (po.product_id === productId) {
      lineItem = { product_id: po.product_id, product_name: po.product_name, quantity: po.quantity, unit_price: po.unit_price };
      totalLineValue = (po.quantity || 0) * (po.unit_price || 0);
    }

    if (!lineItem) continue;

    const productCost = (lineItem.quantity || 0) * (lineItem.unit_price || 0);
    const allocRatio = totalLineValue > 0 ? productCost / totalLineValue : 1;
    const poDate = po.order_date || po.payment_date || "";

    const makeEntry = (suffix, category, amount, desc) => ({
      id: `po-${po.id}-${suffix}`,
      date: poDate,
      transaction_type: "investment",
      category,
      counterparty: po.supplier_name || "",
      counterparty_type: "supplier",
      description: `PO ${po.po_number || ""} — ${desc}`,
      reference_number: po.po_number || "",
      quantity: suffix === "purchase" ? lineItem.quantity || 0 : 0,
      unit_cost: suffix === "purchase" ? lineItem.unit_price || 0 : 0,
      amount_out: amount,
      amount_in: 0,
      notes: "Auto-generated from Purchase Order",
      attachment_urls: [],
      _source: "purchase_order",
      _source_id: po.id,
    });

    result.push(makeEntry("purchase", "Product Purchase", productCost, "Product Purchase"));
    if (po.shipping_cost > 0) result.push(makeEntry("freight", "Freight", po.shipping_cost * allocRatio, "Freight"));
    if (po.import_duties > 0) result.push(makeEntry("customs", "Customs", po.import_duties * allocRatio, "Import Duties"));
    if (po.other_fees > 0) result.push(makeEntry("other", "Miscellaneous", po.other_fees * allocRatio, "Other Fees"));
    if (po.packaging_cost > 0) result.push(makeEntry("packaging", "Packaging", po.packaging_cost * allocRatio, "Packaging"));
    if (po.inspection_cost > 0) result.push(makeEntry("inspection", "Inspection", po.inspection_cost * allocRatio, "Inspection"));
    if (po.prep_handling_cost > 0) result.push(makeEntry("prep", "Prep Center", po.prep_handling_cost * allocRatio, "Prep / Handling"));
  }
  return result;
}

/** Convert CostCenter entries into virtual ledger transactions. */
export function costCenterToLedgerTransactions(costEntries) {
  return costEntries.map((c) => ({
    id: `cc-${c.id}`,
    date: c.date,
    transaction_type: c.transaction_type || "investment",
    category: c.category || "Miscellaneous",
    counterparty: c.supplier || "",
    counterparty_type: "supplier",
    description: c.description || c.category,
    reference_number: c.po_number || "",
    quantity: c.quantity || 0,
    unit_cost: c.unit_cost || 0,
    amount_out: c.amount || 0,
    amount_in: 0,
    notes: c.notes || "Auto-generated from Cost Center",
    attachment_urls: c.attachment_urls || [],
    _source: "cost_center",
    _source_id: c.id,
  }));
}

/** Compute detailed landed cost breakdown for a product from all investment transactions.
 *
 *  KEY INSIGHT: Landed unit cost is built from per-unit costs, NOT total ÷ quantity.
 *  - Items with their own unit_cost (e.g. packaging @ $1.91/unit) contribute unit_cost directly.
 *  - Shared costs without unit_cost (e.g. freight $78.52) are divided by quantity purchased.
 *  - When supplies are bought in bulk (250 packaging units for 100 products), only the
 *    per-unit cost is allocated to each product — not the total bulk purchase ÷ product qty.
 *  - Multiple POs for the same SKU naturally produce a weighted average landed unit cost.
 */
export function computeLandedCostBreakdown(transactions, productId) {
  let purchaseAmount = 0;
  let quantityPurchased = 0;
  const allocated = {
    freight: 0, duties: 0, otherFees: 0,
    packaging: 0, inspection: 0, prep: 0, other: 0,
  };
  const allocatedUnitCosts = {
    freight: 0, duties: 0, otherFees: 0,
    packaging: 0, inspection: 0, prep: 0, other: 0,
  };

  for (const txn of transactions) {
    if (txn.transaction_type !== "investment") continue;
    const amt = txnAmountForProduct(txn, productId);
    const qty = txnQtyForProduct(txn, productId);
    const uc = txn.unit_cost || 0;
    const cat = (txn.category || "").toLowerCase();

    if (cat.includes("purchase") || cat.includes("manufacturing")) {
      purchaseAmount += amt;
      quantityPurchased += qty;
    } else if (cat.includes("freight")) {
      allocated.freight += amt;
      if (uc > 0) allocatedUnitCosts.freight += uc;
    } else if (cat.includes("customs") || cat.includes("duties")) {
      allocated.duties += amt;
      if (uc > 0) allocatedUnitCosts.duties += uc;
    } else if (cat.includes("packaging") || cat.includes("custom box") || cat.includes("labels") || cat.includes("inserts")) {
      allocated.packaging += amt;
      if (uc > 0) allocatedUnitCosts.packaging += uc;
    } else if (cat.includes("inspection") || cat.includes("quality")) {
      allocated.inspection += amt;
      if (uc > 0) allocatedUnitCosts.inspection += uc;
    } else if (cat.includes("prep") || cat.includes("handling") || cat.includes("assembly")) {
      allocated.prep += amt;
      if (uc > 0) allocatedUnitCosts.prep += uc;
    } else if (cat.includes("miscellaneous") || cat.includes("other")) {
      allocated.otherFees += amt;
      if (uc > 0) allocatedUnitCosts.otherFees += uc;
    } else {
      allocated.other += amt;
      if (uc > 0) allocatedUnitCosts.other += uc;
    }
  }

  const totalAllocatedCosts = Object.values(allocated).reduce((s, v) => s + v, 0);
  const totalInvestment = purchaseAmount + totalAllocatedCosts;
  const supplierUnitCost = quantityPurchased > 0 ? purchaseAmount / quantityPurchased : 0;

  // Build per-unit costs: use unit_cost where available, else divide by quantity
  const perUnit = {};
  for (const key of Object.keys(allocated)) {
    if (allocatedUnitCosts[key] > 0) {
      perUnit[key] = allocatedUnitCosts[key];
    } else if (allocated[key] > 0 && quantityPurchased > 0) {
      perUnit[key] = allocated[key] / quantityPurchased;
    } else {
      perUnit[key] = 0;
    }
  }

  const totalAllocatedPerUnit = Object.values(perUnit).reduce((s, v) => s + v, 0);
  const landedUnitCost = supplierUnitCost + totalAllocatedPerUnit;
  const totalLandedCost = landedUnitCost * quantityPurchased;

  return {
    purchaseAmount,
    quantityPurchased,
    allocated,
    allocatedUnitCosts,
    perUnit,
    totalAllocatedCosts,
    totalAllocatedPerUnit,
    totalInvestment,
    totalLandedCost,
    landedUnitCost,
    supplierUnitCost,
  };
}

/** Build chronological ledger rows with running balance for a product. */
export function buildLedgerRows(transactions, productId) {
  const sorted = [...transactions].sort((a, b) => {
    const da = a.date || "";
    const db = b.date || "";
    if (da !== db) return da.localeCompare(db);
    return (a.created_date || "").localeCompare(b.created_date || "");
  });
  let balance = 0;
  return sorted.map((txn) => {
    const amt = txnAmountForProduct(txn, productId);
    let inflow = 0,
      outflow = 0;
    if (txn.transaction_type === "revenue") inflow = amt;
    else if (txn.transaction_type === "investment" || txn.transaction_type === "expense") outflow = amt;
    else if (txn.transaction_type === "adjustment") {
      if (amt >= 0) inflow = amt;
      else outflow = Math.abs(amt);
    }
    balance += inflow - outflow;
    return { ...txn, _inflow: inflow, _outflow: outflow, _balance: balance };
  });
}