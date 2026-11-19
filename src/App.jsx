import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Products from '@/pages/Products';
import PurchaseOrders from '@/pages/PurchaseOrders';
import ProductLedger from '@/pages/ProductLedger';
import CostCenter from '@/pages/CostCenter';
import UserManagement from '@/pages/UserManagement';
import ChannelReports from '@/pages/ChannelReports';
import SampleShipments from '@/pages/SampleShipments';
import MarketingAllocations from '@/pages/MarketingAllocations';
import PermissionGate from '@/components/PermissionGate';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <PermissionGate page={mainPageKey}>
            <MainPage />
          </PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/Products" element={
        <LayoutWrapper currentPageName="Products">
          <PermissionGate page="Products"><Products /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/PurchaseOrders" element={
        <LayoutWrapper currentPageName="PurchaseOrders">
          <PermissionGate page="PurchaseOrders"><PurchaseOrders /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/ProductLedger" element={
        <LayoutWrapper currentPageName="ProductLedger">
          <PermissionGate page="ProductLedger"><ProductLedger /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/CostCenter" element={
        <LayoutWrapper currentPageName="CostCenter">
          <PermissionGate page="CostCenter"><CostCenter /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/ChannelReports" element={
        <LayoutWrapper currentPageName="ChannelReports">
          <PermissionGate page="ChannelReports"><ChannelReports /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/SampleShipments" element={
        <LayoutWrapper currentPageName="SampleShipments">
          <PermissionGate page="SampleShipments"><SampleShipments /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/MarketingAllocations" element={
        <LayoutWrapper currentPageName="MarketingAllocations">
          <PermissionGate page="MarketingAllocations"><MarketingAllocations /></PermissionGate>
        </LayoutWrapper>
      } />
      <Route path="/UserManagement" element={
        <LayoutWrapper currentPageName="UserManagement">
          <UserManagement />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <PermissionGate page={path}>
                <Page />
              </PermissionGate>
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App