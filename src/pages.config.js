/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgencyCommission from './pages/AgencyCommission';
import BrandAI from './pages/BrandAI';
import BrandAssets from './pages/BrandAssets';
import BrandAudience from './pages/BrandAudience';
import BrandCompetitors from './pages/BrandCompetitors';
import BrandDNA from './pages/BrandDNA';
import BrandMessaging from './pages/BrandMessaging';
import BrandOverview from './pages/BrandOverview';
import BrandPersonas from './pages/BrandPersonas';
import BrandPositioning from './pages/BrandPositioning';
import BrandStrategy from './pages/BrandStrategy';
import BrandValue from './pages/BrandValue';
import CompanyProfile from './pages/CompanyProfile';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Domains from './pages/Domains';
import Inventory from './pages/Inventory';
import KPIDashboard from './pages/KPIDashboard';
import MarketingContent from './pages/MarketingContent';
import MarketingHub from './pages/MarketingHub';
import MarketingInfluencers from './pages/MarketingInfluencers';
import MarketingInstagram from './pages/MarketingInstagram';
import MarketingPinterest from './pages/MarketingPinterest';
import MarketingTikTok from './pages/MarketingTikTok';
import MarketingWebsite from './pages/MarketingWebsite';
import MarketingYouTube from './pages/MarketingYouTube';
import Notifications from './pages/Notifications';
import Operations from './pages/Operations';
import ProductDetail from './pages/ProductDetail';
import ProductDevelopment from './pages/ProductDevelopment';
import PricingStrategy from './pages/PricingStrategy';
import SalesDashboard from './pages/SalesDashboard';
import Settings from './pages/Settings';
import TaxCompliance from './pages/TaxCompliance';
import WholesaleInvoices from './pages/WholesaleInvoices';
import BrandExpenses from './pages/BrandExpenses';
import Suppliers from './pages/Suppliers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgencyCommission": AgencyCommission,
    "BrandAI": BrandAI,
    "BrandAssets": BrandAssets,
    "BrandAudience": BrandAudience,
    "BrandCompetitors": BrandCompetitors,
    "BrandDNA": BrandDNA,
    "BrandMessaging": BrandMessaging,
    "BrandOverview": BrandOverview,
    "BrandPersonas": BrandPersonas,
    "BrandPositioning": BrandPositioning,
    "BrandStrategy": BrandStrategy,
    "BrandValue": BrandValue,
    "CompanyProfile": CompanyProfile,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Domains": Domains,
    "Inventory": Inventory,
    "KPIDashboard": KPIDashboard,
    "MarketingContent": MarketingContent,
    "MarketingHub": MarketingHub,
    "MarketingInfluencers": MarketingInfluencers,
    "MarketingInstagram": MarketingInstagram,
    "MarketingPinterest": MarketingPinterest,
    "MarketingTikTok": MarketingTikTok,
    "MarketingWebsite": MarketingWebsite,
    "MarketingYouTube": MarketingYouTube,
    "Notifications": Notifications,
    "Operations": Operations,
    "ProductDetail": ProductDetail,
    "ProductDevelopment": ProductDevelopment,
    "PricingStrategy": PricingStrategy,
    "SalesDashboard": SalesDashboard,
    "Settings": Settings,
    "TaxCompliance": TaxCompliance,
    "WholesaleInvoices": WholesaleInvoices,
    "BrandExpenses": BrandExpenses,
    "Suppliers": Suppliers,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};