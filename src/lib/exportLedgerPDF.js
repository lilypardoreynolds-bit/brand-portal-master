import { computeKPIs, computeLandedCostBreakdown, buildLedgerRows } from "@/lib/ledgerCalc";

function fmtMoney(n) {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) {
  return `${(Number(n) || 0).toFixed(1)}%`;
}

export async function exportProductLedgerPDF({ productName, transactions, productId }) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const GREEN = [120, 175, 134];
  const GREEN_DARK = [74, 124, 94];
  const GREEN_LIGHT = [232, 248, 239];

  const k = computeKPIs(transactions, productId);
  const b = computeLandedCostBreakdown(transactions, productId);
  const ledgerRows = buildLedgerRows(transactions, productId);

  const PAGE_W = 210;
  const M = 14;
  let y = 0;

  // --- Header ---
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Product Financial Ledger Report", M, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Product: ${productName}`, M, 22);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, PAGE_W - M, 22, { align: "right" });
  y = 42;

  // --- Section 1: Financial Summary ---
  doc.setTextColor(...GREEN_DARK);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", M, y);
  y += 3;
  doc.setDrawColor(...GREEN);
  doc.line(M, y, PAGE_W - M, y);
  y += 8;

  const kpiPairs = [
    ["Total Investment", fmtMoney(k.investment)],
    ["Total Revenue", fmtMoney(k.revenue)],
    ["Total Expenses", fmtMoney(k.expenses)],
    ["Gross Profit", fmtMoney(k.grossProfit)],
    ["Net Profit", fmtMoney(k.netProfit)],
    ["Inventory Value", fmtMoney(k.inventoryValue)],
    ["Supplier Unit Cost", fmtMoney(b.supplierUnitCost)],
    ["Landed Unit Cost", fmtMoney(b.landedUnitCost)],
    ["Units Purchased", k.unitsPurchased.toLocaleString()],
    ["Units Sold", k.unitsSold.toLocaleString()],
    ["Units Remaining", k.unitsRemaining.toLocaleString()],
    ["ROI", fmtPct(k.roi)],
    ["Profit Margin", fmtPct(k.profitMargin)],
    ["Break-even / Unit", fmtMoney(k.breakEvenPrice)],
    ["Investment to Recover", fmtMoney(k.remainingToRecover)],
  ];

  const colW = (PAGE_W - 2 * M) / 3;
  kpiPairs.forEach((pair, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * colW;
    const ry = y + row * 13;
    doc.setFillColor(...GREEN_LIGHT);
    doc.roundedRect(x + 1, ry - 5, colW - 4, 11, 1, 1, "F");
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(pair[0].toUpperCase(), x + 3, ry - 1.5);
    doc.setTextColor(25, 25, 25);
    doc.setFontSize(9);
    doc.text(pair[1], x + 3, ry + 3.5);
  });
  y += Math.ceil(kpiPairs.length / 3) * 13 + 4;

  // --- Section 2: Landed Cost Breakdown ---
  if (y > 225) { doc.addPage(); y = 20; }
  doc.setTextColor(...GREEN_DARK);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Landed Cost Breakdown", M, y);
  y += 3;
  doc.setDrawColor(...GREEN);
  doc.line(M, y, PAGE_W - M, y);
  y += 7;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(110, 110, 110);
  doc.text("Cost Component", M, y);
  doc.text("Total Spent", M + 110, y, { align: "right" });
  doc.text("Per Unit", PAGE_W - M, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const breakdownRows = [
    ["Purchase Cost", b.purchaseAmount, b.supplierUnitCost],
    ["Allocated Freight", b.allocated.freight, b.perUnit.freight],
    ["Allocated Duties", b.allocated.duties, b.perUnit.duties],
    ["Allocated Other Fees", b.allocated.otherFees, b.perUnit.otherFees],
    ["Allocated Packaging", b.allocated.packaging, b.perUnit.packaging],
    ["Allocated Inspection", b.allocated.inspection, b.perUnit.inspection],
    ["Allocated Prep / Handling", b.allocated.prep, b.perUnit.prep],
    ["Other Allocated Costs", b.allocated.other, b.perUnit.other],
  ];
  breakdownRows.forEach(([label, total, perUnit]) => {
    doc.text(label, M, y);
    doc.text(fmtMoney(total), M + 110, y, { align: "right" });
    doc.text(fmtMoney(perUnit), PAGE_W - M, y, { align: "right" });
    y += 5.5;
  });
  y += 1;
  doc.setDrawColor(...GREEN);
  doc.line(M, y - 1, PAGE_W - M, y - 1);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Total Landed Cost", M, y);
  doc.text(fmtMoney(b.totalLandedCost), M + 110, y, { align: "right" });
  doc.setTextColor(...GREEN_DARK);
  doc.text(fmtMoney(b.landedUnitCost), PAGE_W - M, y, { align: "right" });
  y += 10;

  // --- Section 3: Transaction Ledger ---
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setTextColor(...GREEN_DARK);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Ledger", M, y);
  y += 3;
  doc.setDrawColor(...GREEN);
  doc.line(M, y, PAGE_W - M, y);
  y += 7;

  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "bold");
  doc.text("Date", M, y);
  doc.text("Type", M + 25, y);
  doc.text("Category", M + 45, y);
  doc.text("Description", M + 78, y);
  doc.text("Out (-)", M + 150, y, { align: "right" });
  doc.text("In (+)", M + 172, y, { align: "right" });
  doc.text("Balance", PAGE_W - M, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  ledgerRows.forEach((row) => {
    if (y > 275) { doc.addPage(); y = 20; }
    const date = row.date ? new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";
    doc.setTextColor(60, 60, 60);
    doc.text(date, M, y);
    doc.text((row.transaction_type || "").substring(0, 10), M + 25, y);
    doc.text(String(row.category || "").substring(0, 18), M + 45, y);
    doc.text(String(row.description || "").substring(0, 42), M + 78, y);
    if (row._outflow > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(fmtMoney(row._outflow), M + 150, y, { align: "right" });
    }
    if (row._inflow > 0) {
      doc.setTextColor(37, 99, 235);
      doc.text(fmtMoney(row._inflow), M + 172, y, { align: "right" });
    }
    doc.setTextColor(40, 40, 40);
    doc.text(fmtMoney(row._balance), PAGE_W - M, y, { align: "right" });
    y += 5;
  });

  // --- Footer on every page ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...GREEN_LIGHT);
    doc.rect(0, 283, PAGE_W, 14, "F");
    doc.setTextColor(...GREEN_DARK);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("minimee — Product Financial Ledger Report", M, 291);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - M, 291, { align: "right" });
  }

  doc.save(`${productName.replace(/[^a-zA-Z0-9]/g, "_")}_financial_report.pdf`);
}