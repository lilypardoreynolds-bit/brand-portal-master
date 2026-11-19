import { jsPDF } from "jspdf";
import { calcChannels, OPS_RATE, PROCESSING_FEE_RATE } from "./pricingCalc";

function fmt(n) {
  return n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
}
function pct(n) {
  return `${n.toFixed(1)}%`;
}

export function exportScenarioPDF(scenario) {
  const doc = new jsPDF();
  const channels = calcChannels(scenario);

  const primaryColor = [120, 175, 134];  // minimeé sage green #78AF86
  const darkText = [34, 74, 54];
  const mutedText = [74, 124, 94];
  const lightBg = [240, 253, 244];

  // ─── Header ───────────────────────────────────────────────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PRICING STRATEGY REPORT", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(scenario.name, 14, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 20);

  // ─── Inputs Summary ───────────────────────────────────────
  let y = 36;

  // Section title
  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SCENARIO OVERVIEW", 14, y);
  y += 4;
  doc.setDrawColor(120, 175, 134);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  doc.setLineWidth(0.2);
  y += 7;

  const landed = (scenario.product_cost || 0) + (scenario.shipping_cost || 0) + (scenario.import_cost || 0) + (scenario.import_extra_costs || 0);

  // Helper: draw a mini card
  function drawCard(x, cardY, cardW, cardH, title, accentColor, rows, totalLabel, totalValue, totalColor) {
    // Card bg
    doc.setFillColor(248, 249, 252);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "F");
    doc.setDrawColor(220, 222, 235);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "S");

    // Title strip
    doc.setFillColor(...accentColor);
    doc.roundedRect(x, cardY, cardW, 9, 2, 2, "F");
    doc.setFillColor(...accentColor);
    doc.rect(x, cardY + 5, cardW, 4, "F"); // flatten bottom corners
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + cardW / 2, cardY + 6.2, { align: "center" });

    let ry = cardY + 14;
    rows.forEach(([label, value]) => {
      doc.setTextColor(...mutedText);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(label, x + 4, ry);
      doc.setTextColor(...darkText);
      doc.setFont("helvetica", "bold");
      doc.text(value, x + cardW - 4, ry, { align: "right" });
      ry += 6;
    });

    if (totalLabel) {
      // Divider
      doc.setDrawColor(200, 202, 220);
      doc.line(x + 3, ry, x + cardW - 3, ry);
      ry += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...(totalColor || darkText));
      doc.text(totalLabel, x + 4, ry);
      doc.text(totalValue, x + cardW - 4, ry, { align: "right" });
    }
  }

  const leftW = 90;
  const rightW = 82;
  const gap = 10;
  const rightX = 14 + leftW + gap;
  const smallGap = 6;
  const rowH = 6; // height per data row
  const headerH = 9;
  const paddingV = 10; // top + bottom padding inside card

  function cardHeight(numRows, hasTotal) {
    return headerH + paddingV + numRows * rowH + (hasTotal ? 10 : 0);
  }

  const importExtraRows = scenario.import_extra_costs > 0 ? 1 : 0;
  const importH = cardHeight(3 + importExtraRows, true);
  const pricingH = cardHeight(2, false);
  const channelH = cardHeight(1, false);
  const opsH = cardHeight(2, false);
  const totalRightH = pricingH + channelH + opsH + smallGap * 2;
  const leftH = Math.max(importH, totalRightH);

  // Left: Importation
  const importRows = [
    ["Product Cost", fmt(scenario.product_cost || 0)],
    ["Shipping Cost", fmt(scenario.shipping_cost || 0)],
    ["Fees / Duties", fmt(scenario.import_cost || 0)],
    ...(scenario.import_extra_costs > 0 ? [["Extra Costs (Labels/Tags)", fmt(scenario.import_extra_costs || 0)]] : []),
  ];
  drawCard(14, y, leftW, leftH, "IMPORTATION", [120, 175, 134], importRows, "Landed Cost", fmt(landed), [22, 163, 74]);

  // Compute actual wholesale revenue (same logic as calcChannels)
  const wholesaleRevenue = (scenario.wholesale_price || 0) > 0
    ? scenario.wholesale_price
    : (scenario.retail_price || 0) * 0.5;

  // Right col: 3 auto-sized stacked cards
  drawCard(rightX, y, rightW, pricingH, "PRICING", [90, 152, 106], [
    ["Retail Price", fmt(scenario.retail_price || 0)],
    ["Wholesale Price", fmt(wholesaleRevenue)],
  ], null, null, null);

  drawCard(rightX, y + pricingH + smallGap, rightW, channelH, "CHANNEL FEES", [74, 124, 94], [
    ["Amazon FBA Fee", fmt(scenario.amazon_fba_fee || 0)],
  ], null, null, null);

  drawCard(rightX, y + pricingH + channelH + smallGap * 2, rightW, opsH, "OPS RATES", [149, 191, 159], [
    ["OPS Rate", pct(OPS_RATE * 100)],
    ["Processing Fee", pct(PROCESSING_FEE_RATE * 100)],
  ], null, null, null);

  y += leftH + 8;

  if (scenario.notes) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, 182, 10, 2, 2, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(74, 124, 94);
    doc.text(`📝  ${scenario.notes}`, 18, y + 6.5);
    y += 14;
  }

  // ─── Channel Results ──────────────────────────────────────
  y += 6;
  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CHANNEL RESULTS", 14, y);

  y += 5;
  doc.setDrawColor(220, 220, 235);
  doc.line(14, y, 196, y);
  y += 6;

  const colW = 58;
  const startX = [14, 76, 138];

  channels.forEach((ch, i) => {
    const x = startX[i];

    // Card background
    doc.setFillColor(...lightBg);
    doc.roundedRect(x, y, colW, 82, 3, 3, "F");

    // Channel title
    doc.setFillColor(120, 175, 134);
    doc.roundedRect(x, y, colW, 10, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(ch.label, x + colW / 2, y + 7, { align: "center" });

    let cy = y + 16;
    const rows = [
      ["Revenue", fmt(ch.revenue), false],
      ["Landed Cost", `-${fmt(ch.landed)}`, true],
      ["OPS (25%)", `-${fmt(ch.ops)}`, true],
      ...(ch.key !== "amazon" ? [["Processing Fee (3.5%)", `-${fmt(ch.processingFee)}`, true]] : []),
      ...(ch.key === "shopify" && ch.opsExtraCosts > 0 ? [["OPS Extra Costs", `-${fmt(ch.opsExtraCosts)}`, true]] : []),
      ...(ch.channelFee > 0 ? [["Channel Fee", `-${fmt(ch.channelFee)}`, true]] : []),
    ];

    rows.forEach(([label, value, neg]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      if (neg) doc.setTextColor(200, 50, 50); else doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.text(label, x + 4, cy);
      doc.setFont("helvetica", "bold");
      if (neg) doc.setTextColor(200, 50, 50); else doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(value, x + colW - 4, cy, { align: "right" });
      cy += 6;
    });

    // Shopify shipping note
    if (ch.key === "shopify") {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(74, 124, 94);
      doc.text("* Shipping cost not included — variable", x + 4, cy);
      cy += 6;
    }

    // Net Profit
    cy += 2;
    doc.setDrawColor(180, 180, 200);
    doc.line(x + 3, cy - 2, x + colW - 3, cy - 2);
    const profitColor = ch.profit >= 0 ? [22, 163, 74] : [220, 38, 38];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...profitColor);
    doc.text("Net Profit", x + 4, cy + 4);
    doc.text(fmt(ch.profit), x + colW - 4, cy + 4, { align: "right" });

    // Margin & ROI
    cy += 10;
    const marginColor = ch.margin >= 30 ? [22, 163, 74] : ch.margin >= 15 ? [217, 119, 6] : [220, 38, 38];
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedText);
    doc.text(`Margin: `, x + 4, cy);
    doc.setTextColor(...marginColor);
    doc.setFont("helvetica", "bold");
    doc.text(pct(ch.margin), x + 20, cy);

    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.text(`ROI: `, x + 32, cy);
    doc.setTextColor(90, 152, 106);
    doc.setFont("helvetica", "bold");
    doc.text(pct(ch.roi), x + 42, cy);
  });

  // ─── Footer ───────────────────────────────────────────────
  doc.setFillColor(232, 248, 239);
  doc.rect(0, 283, 210, 14, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text("Pricing Strategy Report — Confidential", 14, 291);
  doc.text(`Page 1 of 1`, 196, 291, { align: "right" });

  doc.save(`${scenario.name.replace(/[^a-z0-9]/gi, "_")}_pricing.pdf`);
}