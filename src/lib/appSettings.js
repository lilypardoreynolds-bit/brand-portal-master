import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const MAIN_WAREHOUSE = "Own Warehouse";
export const DEFAULT_WAREHOUSES = [MAIN_WAREHOUSE, "Amazon FBA", "Other"];
export const DEFAULT_SALES_CHANNELS = ["Amazon", "TikTok Shop", "Shopify"];
export const DEFAULT_BRAND_COLOR = "#78AF86";

// Last known brand name, for non-React code (PDF exports, HTML reports)
let cachedBrandName = "";
let cachedLogoUrl = "";
export function getBrandName() {
  return cachedBrandName || "Brand";
}
export function getBrandLogo() {
  return cachedLogoUrl;
}

/** Darken a hex color by a factor (0-1) for hover states. */
export function darken(hex, factor = 0.18) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#5d8f6b";
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * (1 - factor));
  const g = Math.round(((n >> 8) & 255) * (1 - factor));
  const b = Math.round((n & 255) * (1 - factor));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/**
 * Per-brand settings. There is a single AppSettings record per app.
 * Anything that used to be hard-coded for one brand (warehouse names, default tax rate...)
 * lives here so the same code works for every brand.
 */
export function useAppSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const list = await base44.entities.AppSettings.list("-created_date", 1);
      return list?.[0] || null;
    },
    staleTime: 60_000,
  });

  const settings = data || {};
  if (settings.brand_name) cachedBrandName = settings.brand_name;
  if (settings.logo_url) cachedLogoUrl = settings.logo_url;
  const extra = (settings.warehouses || []).filter((w) => w && w !== MAIN_WAREHOUSE);
  const warehouses = [MAIN_WAREHOUSE, ...(extra.length ? extra : DEFAULT_WAREHOUSES.slice(1))];
  const salesChannels = settings.sales_channels?.length ? settings.sales_channels : DEFAULT_SALES_CHANNELS;

  const save = async (patch) => {
    if (data?.id) await base44.entities.AppSettings.update(data.id, patch);
    else await base44.entities.AppSettings.create(patch);
    await qc.invalidateQueries({ queryKey: ["app_settings"] });
  };

  return {
    settings,
    isLoading,
    warehouses,
    salesChannels,
    defaultTaxRate: settings.default_tax_rate ?? 6.5,
    brandName: settings.brand_name || "",
    logoUrl: settings.logo_url || "",
    brandColor: settings.primary_color || DEFAULT_BRAND_COLOR,
    save,
  };
}
