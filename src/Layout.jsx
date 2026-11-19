import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Building2, FileText, Globe, Bell, Settings,
  ChevronLeft, Menu, LogOut, BarChart2, Megaphone, LayoutGrid,
  Instagram, Youtube, FileImage, FileVideo, Users, PenTool, ChevronDown, ChevronRight,
  Compass, Target, Lightbulb, Swords, Mic2, FlaskConical, ShoppingBag, Palette, ClipboardList, Boxes, Receipt, MessageSquare, Dna, Shield, TrendingUp, Truck, UserCog, BookOpen, Calculator
} from "lucide-react";
import { canAccessSection } from "@/lib/permissions";
import { LanguageProvider, useLanguage } from "@/components/i18n/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { LANGUAGES } from "@/components/i18n/translations";
import { useAppSettings, darken } from "@/lib/appSettings";
import { Inbox } from "lucide-react";

const MARKETING_PAGES = [
  "MarketingHub", "MarketingWebsite", "MarketingInstagram", "MarketingTikTok",
  "MarketingYouTube", "MarketingPinterest", "MarketingContent", "MarketingInfluencers"
];

const BRAND_PAGES = [
  "BrandStrategy", "BrandOverview", "BrandAudience", "BrandPersonas",
  "BrandValue", "BrandCompetitors", "BrandPositioning", "BrandMessaging"
];

const getBrandSubItems = (t) => [
  { name: t.nav.overview, icon: Compass, page: "BrandOverview" },
  { name: t.nav.targetAudience, icon: Target, page: "BrandAudience" },
  { name: t.nav.customerPersonas, icon: Users, page: "BrandPersonas" },
  { name: t.nav.valueProposition, icon: Lightbulb, page: "BrandValue" },
  { name: t.nav.competitors, icon: Swords, page: "BrandCompetitors" },
  { name: t.nav.positioning, icon: BarChart2, page: "BrandPositioning" },
  { name: t.nav.voiceMessaging, icon: Mic2, page: "BrandMessaging" },
];

const getNavGroups = (t) => [
  {
    label: null,
    items: [
      { name: t.nav.dashboard, icon: LayoutDashboard, page: "Dashboard", sectionKey: "dashboard" },
    ]
  },
  {
    label: t.navGroups.overview,
    items: [
      { name: t.nav.kpiDashboard, icon: BarChart2, page: "KPIDashboard", sectionKey: "kpi" },
      { name: t.nav.notifications, icon: Bell, page: "Notifications", sectionKey: "notifications" },
    ]
  },
  {
    label: t.navGroups.company,
    items: [
      { name: t.nav.companyProfile, icon: Building2, page: "CompanyProfile", sectionKey: "company" },
      { name: t.nav.documentation, icon: FileText, page: "Documentation", sectionKey: "company" },
      { name: t.nav.domains, icon: Globe, page: "Domains", sectionKey: "company" },
    ]
  },
  {
    label: t.navGroups.products,
    items: [
      { name: "Product", icon: ShoppingBag, page: "Products", sectionKey: "products" },
      { name: "Supplier", icon: Truck, page: "Suppliers", sectionKey: "products" },
      { name: "Purchase Orders", icon: Truck, page: "PurchaseOrders", sectionKey: "products" },
      { name: "Product Ledger", icon: BookOpen, page: "ProductLedger", sectionKey: "products" },
      { name: t.nav.inventory, icon: Boxes, page: "Inventory", sectionKey: "inventory" },
    ]
  },
  {
    label: t.navGroups.sales,
    items: [
      { name: t.nav.salesDistribution, icon: ShoppingBag, page: "SalesDashboard", sectionKey: "sales" },
      { name: t.nav.pricingStrategy || "Pricing Strategy", icon: LayoutGrid, page: "PricingStrategy", sectionKey: "sales" },
    ]
  },
  // Marketing section hidden for now
  {
    label: t.navGroups.operations,
    items: [
      { name: t.nav.brandAssets, icon: Palette, page: "BrandAssets", sectionKey: "brand" },
      { name: t.nav.operations, icon: ClipboardList, page: "Operations", sectionKey: "operations" },
    ]
  },
  {
    label: t.navGroups.finance,
    items: [
      { name: t.nav.taxCompliance, icon: Shield, page: "TaxCompliance", sectionKey: "finance" },
      { name: t.nav.agencyCommission, icon: TrendingUp, page: "AgencyCommission", sectionKey: "finance" },
      { name: t.nav.brandExpenses, icon: Receipt, page: "BrandExpenses", sectionKey: "finance" },
    ]
  },
  {
    label: t.navGroups.system,
    items: [
      { name: t.nav.settings, icon: Settings, page: "Settings", sectionKey: "settings" },
      { name: "User Management", icon: UserCog, page: "UserManagement", adminOnly: true },
    ]
  },
];

const getMarketingSubItems = (t) => [
  { name: t.nav.website, icon: Globe, page: "MarketingWebsite" },
  { name: t.nav.instagram, icon: Instagram, page: "MarketingInstagram" },
  { name: t.nav.tiktok, icon: FileVideo, page: "MarketingTikTok" },
  { name: t.nav.youtube, icon: Youtube, page: "MarketingYouTube" },
  { name: t.nav.pinterest, icon: FileImage, page: "MarketingPinterest" },
  { name: t.nav.contentCreation, icon: PenTool, page: "MarketingContent" },
  { name: t.nav.influencers, icon: Users, page: "MarketingInfluencers" },
];

function LanguageSelector() {
  const { lang, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-md transition-colors",
            lang === l.code
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
          title={l.name}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function LayoutInner({ children, currentPageName }) {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { brandName, logoUrl, brandColor } = useAppSettings();
  React.useEffect(() => {
    document.documentElement.style.setProperty("--brand", brandColor);
    document.documentElement.style.setProperty("--brand-dark", darken(brandColor));
    if (brandName) document.title = `${brandName} Portal`;
  }, [brandColor, brandName]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(MARKETING_PAGES.includes(currentPageName));
  const [brandOpen, setBrandOpen] = useState(BRAND_PAGES.includes(currentPageName));

  const { data: notifications = [] } = useQuery({
    queryKey: ["unread_notifications"],
    queryFn: () => base44.entities.Notification.filter({ is_read: false }),
    initialData: [],
  });

  const unreadCount = notifications.length;
  const navGroups = getNavGroups(t);
  const navItems = navGroups.flatMap(g => g.items);
  const marketingSubItems = getMarketingSubItems(t);
  const brandSubItems = getBrandSubItems(t);

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col text-white transition-all duration-300",
          "bg-[var(--brand)]",
          collapsed ? "w-[72px]" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-white/10",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName || "Logo"} className="h-14 w-auto object-contain" />
              ) : (
                <span className="text-lg font-bold tracking-tight">{brandName || "Brand Portal"}</span>
              )}
            </div>
          )}
          {collapsed && (
            logoUrl ? (
              <img src={logoUrl} alt={brandName || "Logo"} className="h-10 w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold">{(brandName || "B").charAt(0)}</span>
            )
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex items-center justify-center h-7 w-7 rounded-md hover:bg-black/20 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="hidden lg:flex absolute -right-3 top-[1.15rem] h-6 w-6 rounded-full bg-[var(--brand-dark)] border border-white/20 items-center justify-center hover:brightness-110 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-slate-300 rotate-180" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.label && !collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">{group.label}</p>
              )}
              {group.label && collapsed && gi > 0 && (
                <div className="mx-3 mb-1 border-t border-white/10" />
              )}
              <div className="space-y-0.5">
                {group.items.filter(item => {
                  if (item.adminOnly) return currentUser?.role === "admin";
                  return canAccessSection(currentUser, item.sectionKey);
                }).map((item) => {
                  const isActive = currentPageName === item.page;
                  const isMarketingGroup = item.group === "marketing";
                  const isMarketingActive = MARKETING_PAGES.includes(currentPageName);
                  const isBrandGroup = item.group === "brand";
                  const isBrandActive = BRAND_PAGES.includes(currentPageName);

                  if (isBrandGroup) {
                    return (
                      <div key={item.page}>
                        <button
                          onClick={() => { if (collapsed) { setCollapsed(false); setBrandOpen(true); } else { setBrandOpen(b => !b); } }}
                          title={collapsed ? item.name : undefined}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                            isBrandActive ? "bg-black/20 text-white" : "text-white/60 hover:text-white hover:bg-black/20"
                          )}
                        >
                          <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isBrandActive && "text-white")} />
                          {!collapsed && <span className="flex-1 truncate text-left">{item.name}</span>}
                          {!collapsed && (brandOpen ? <ChevronDown className="h-3.5 w-3.5 text-white/40" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40" />)}
                        </button>
                        {!collapsed && brandOpen && (
                          <div className="ml-3 mt-0.5 pl-3 border-l border-white/10 space-y-0.5">
                            {brandSubItems.map(sub => {
                              const subActive = currentPageName === sub.page;
                              return (
                                <Link key={sub.page} to={createPageUrl(sub.page)} onClick={() => setMobileOpen(false)}
                                  className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                                    subActive ? "bg-black/20 text-white" : "text-white/50 hover:text-white hover:bg-black/20")}
                                >
                                  <sub.icon className={cn("h-3.5 w-3.5 flex-shrink-0", subActive && "text-white")} />
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isMarketingGroup) {
                    return (
                      <div key={item.page}>
                        <button
                          onClick={() => { if (collapsed) { setCollapsed(false); setMarketingOpen(true); } else { setMarketingOpen(m => !m); } }}
                          title={collapsed ? item.name : undefined}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                            isMarketingActive ? "bg-black/20 text-white" : "text-white/60 hover:text-white hover:bg-black/20"
                          )}
                        >
                          <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isMarketingActive && "text-white")} />
                          {!collapsed && <span className="flex-1 truncate text-left">{item.name}</span>}
                          {!collapsed && (marketingOpen ? <ChevronDown className="h-3.5 w-3.5 text-white/40" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40" />)}
                        </button>
                        {!collapsed && marketingOpen && (
                          <div className="ml-3 mt-0.5 pl-3 border-l border-white/10 space-y-0.5">
                            {marketingSubItems.map(sub => {
                              const subActive = currentPageName === sub.page;
                              return (
                                <Link key={sub.page} to={createPageUrl(sub.page)} onClick={() => setMobileOpen(false)}
                                  className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                                    subActive ? "bg-black/20 text-white" : "text-white/50 hover:text-white hover:bg-black/20")}
                                >
                                  <sub.icon className={cn("h-3.5 w-3.5 flex-shrink-0", subActive && "text-white")} />
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                        isActive ? "bg-black/20 text-white" : "text-white/60 hover:text-white hover:bg-black/20"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "text-white")} />
                      {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                      {!collapsed && item.page === "Notifications" && unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-[10px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                          {unreadCount}
                        </Badge>
                      )}
                      {collapsed && item.page === "Notifications" && unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className={cn("border-t border-white/10 p-2.5", collapsed && "flex justify-center")}>
          <button
            onClick={() => base44.auth.logout()}
            className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-black/20 transition-colors w-full",
              collapsed && "justify-center px-0 w-auto"
            )}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>{t.nav.logOut}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-base font-semibold text-slate-900">
              {navItems.find((n) => n.page === currentPageName)?.name ||
               marketingSubItems.find((n) => n.page === currentPageName)?.name ||
               brandSubItems.find((n) => n.page === currentPageName)?.name ||
               (currentPageName === "BrandStrategy" ? "Brand Strategy" : currentPageName === "ProductDetail" ? "Product Detail" : currentPageName === "SalesDashboard" ? "Sales & Distribution" : currentPageName === "BrandAssets" ? "Brand Assets" : currentPageName === "TaxCompliance" ? "Tax Compliance" : currentPageName === "AgencyCommission" ? "Agency Commission" : currentPageName)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link to={createPageUrl("Notifications")}>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-[18px] w-[18px] text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutInner currentPageName={currentPageName}>{children}</LayoutInner>
    </LanguageProvider>
  );
}