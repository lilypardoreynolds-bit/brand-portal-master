// Shared calculation utilities for Pricing Strategy

// Fixed OPS rates
export const MGMT_RATE = 0.15;
export const OPEX_RATE = 0.05;
export const MKT_RATE = 0.05;
export const OPS_RATE = MGMT_RATE + OPEX_RATE + MKT_RATE; // 0.25
export const PROCESSING_FEE_RATE = 0.035; // 3.5%

export function calcLandedCost(s) {
  // Importation: product cost + shipping + fees + import extra costs (labels, tags, packaging)
  return (s.product_cost || 0) + (s.shipping_cost || 0) + (s.import_cost || 0) + (s.import_extra_costs || 0);
}

export function calcOpsCost(revenue) {
  return revenue * OPS_RATE;
}

export function calcChannels(s) {
  const landed = calcLandedCost(s);
  const retail = s.retail_price || 0;
  const wholesale = s.wholesale_price || 0;
  const fbaFee = s.amazon_fba_fee || 0;

  // --- AMAZON ---
  // Cost structure + FBA fee only (no processing fee — Amazon handles card charges)
  const amazonRevenue = retail;
  const amazonProcessingFee = 0;
  const amazonOps = amazonRevenue * OPS_RATE;
  const amazonChannelFee = fbaFee; // Amazon FBA total
  const amazonTotalCost = landed + amazonOps + amazonChannelFee;
  const amazonProfit = amazonRevenue - amazonTotalCost;
  const amazonMargin = amazonRevenue > 0 ? (amazonProfit / amazonRevenue) * 100 : 0;
  const amazonROI = amazonTotalCost > 0 ? (amazonProfit / amazonTotalCost) * 100 : 0;

  // --- SHOPIFY ---
  // Cost structure + processing fee + ops extra costs (shipping box, tape, flyers)
  const opsExtraCosts = s.ops_extra_costs || 0;
  const shopifyRevenue = retail;
  const shopifyProcessingFee = shopifyRevenue * PROCESSING_FEE_RATE;
  const shopifyOps = shopifyRevenue * OPS_RATE;
  const shopifyTotalCost = landed + shopifyOps + shopifyProcessingFee + opsExtraCosts;
  const shopifyProfit = shopifyRevenue - shopifyTotalCost;
  const shopifyMargin = shopifyRevenue > 0 ? (shopifyProfit / shopifyRevenue) * 100 : 0;
  const shopifyROI = shopifyTotalCost > 0 ? (shopifyProfit / shopifyTotalCost) * 100 : 0;

  // --- WHOLESALE ---
  // Cost structure only + processing fee (no channel fee)
  const wholesaleRevenue = wholesale || retail * 0.5; // fallback to 50% of retail
  const wholesaleProcessingFee = wholesaleRevenue * PROCESSING_FEE_RATE;
  const wholesaleOps = wholesaleRevenue * OPS_RATE;
  const wholesaleTotalCost = landed + wholesaleOps + wholesaleProcessingFee;
  const wholesaleProfit = wholesaleRevenue - wholesaleTotalCost;
  const wholesaleMargin = wholesaleRevenue > 0 ? (wholesaleProfit / wholesaleRevenue) * 100 : 0;
  const wholesaleROI = wholesaleTotalCost > 0 ? (wholesaleProfit / wholesaleTotalCost) * 100 : 0;

  return [
    {
      key: "amazon",
      label: "Amazon",
      revenue: amazonRevenue,
      landed,
      ops: amazonOps,
      processingFee: amazonProcessingFee,
      channelFee: amazonChannelFee,
      totalCost: amazonTotalCost,
      profit: amazonProfit,
      margin: amazonMargin,
      roi: amazonROI,
    },
    {
      key: "shopify",
      label: "Shopify",
      revenue: shopifyRevenue,
      landed,
      ops: shopifyOps,
      processingFee: shopifyProcessingFee,
      opsExtraCosts,
      channelFee: 0,
      totalCost: shopifyTotalCost,
      profit: shopifyProfit,
      margin: shopifyMargin,
      roi: shopifyROI,
    },
    {
      key: "wholesale",
      label: "Wholesale",
      revenue: wholesaleRevenue,
      landed,
      ops: wholesaleOps,
      processingFee: wholesaleProcessingFee,
      channelFee: 0,
      totalCost: wholesaleTotalCost,
      profit: wholesaleProfit,
      margin: wholesaleMargin,
      roi: wholesaleROI,
    },
  ];
}