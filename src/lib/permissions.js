/**
 * Centralized permissions configuration.
 * Each permission key maps to one or more page names.
 * Admins always have full access.
 * Users only see sections listed in their `permissions` array.
 */

export const PERMISSION_SECTIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    pages: ["Dashboard"],
  },
  {
    key: "kpi",
    label: "KPI Dashboard",
    pages: ["KPIDashboard"],
  },
  {
    key: "notifications",
    label: "Notifications",
    pages: ["Notifications"],
  },
  {
    key: "company",
    label: "Company Profile & Docs",
    pages: ["CompanyProfile", "Documentation", "Domains"],
  },
  {
    key: "products",
    label: "Products & Suppliers",
    pages: ["Products", "Suppliers", "PurchaseOrders", "ProductDetail", "ProductDevelopment", "ProductLedger", "CostCenter"],
  },
  {
    key: "inventory",
    label: "Inventory",
    pages: ["Inventory"],
  },
  {
    key: "sales",
    label: "Sales & Distribution",
    pages: ["SalesDashboard", "WholesaleInvoices", "PricingStrategy"],
  },
  {
    key: "marketing",
    label: "Marketing",
    pages: [
      "MarketingHub", "MarketingWebsite", "MarketingInstagram",
      "MarketingTikTok", "MarketingYouTube", "MarketingPinterest",
      "MarketingContent", "MarketingInfluencers",
    ],
  },
  {
    key: "brand",
    label: "Brand Strategy",
    pages: [
      "BrandStrategy", "BrandOverview", "BrandAudience", "BrandPersonas",
      "BrandValue", "BrandCompetitors", "BrandPositioning", "BrandMessaging",
      "BrandDNA", "BrandAssets", "BrandAI",
    ],
  },
  {
    key: "operations",
    label: "Operations",
    pages: ["Operations"],
  },
  {
    key: "finance",
    label: "Finance & Tax",
    pages: ["TaxCompliance", "AgencyCommission", "BrandExpenses"],
  },
  {
    key: "settings",
    label: "Settings",
    pages: ["Settings"],
  },
];

/**
 * Returns true if the user can access the given page.
 * Admins and viewers always return true (viewers see everything but can't edit).
 */
export function canAccessPage(user, pageName) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true; // viewers see all pages

  const permissions = user.permissions || [];
  const section = PERMISSION_SECTIONS.find(s => s.pages.includes(pageName));
  if (!section) return false;
  return permissions.includes(section.key);
}

/**
 * Returns true if a nav item (by section key) is visible to the user.
 */
export function canAccessSection(user, sectionKey) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "viewer") return true; // viewers see all nav items
  return (user.permissions || []).includes(sectionKey);
}

/**
 * Returns true if the user is in read-only mode (viewer role).
 */
export function isViewerOnly(user) {
  return user?.role === "viewer";
}

/**
 * Get the section key for a given page name.
 */
export function getSectionForPage(pageName) {
  const section = PERMISSION_SECTIONS.find(s => s.pages.includes(pageName));
  return section?.key || null;
}