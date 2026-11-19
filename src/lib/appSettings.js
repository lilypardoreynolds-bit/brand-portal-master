import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const MAIN_WAREHOUSE = "Own Warehouse";
export const DEFAULT_WAREHOUSES = [MAIN_WAREHOUSE, "Amazon FBA", "Other"];
export const DEFAULT_SALES_CHANNELS = ["Amazon", "TikTok Shop", "Shopify"];

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
    save,
  };
}
