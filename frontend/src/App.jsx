import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import GlobalFilterBar from './components/GlobalFilterBar';
import UploadModal from './components/UploadModal';
import ExportModal from './components/ExportModal';
import AuthModal from './components/AuthModal';
import UserManagementModal from './components/UserManagementModal';
import { Loader2 } from 'lucide-react';

// Overview loaded eagerly for immediate initial page paint
import OverviewPage from './pages/OverviewPage';

// Secondary pages loaded on-demand for optimized bundle performance
const RevenueAnalyticsPage = lazy(() => import('./pages/RevenueAnalyticsPage'));
const TicketSalesPage = lazy(() => import('./pages/TicketSalesPage'));
const RoutePerformancePage = lazy(() => import('./pages/RoutePerformancePage'));
const FlightPerformancePage = lazy(() => import('./pages/FlightPerformancePage'));
const PassengerDemandPage = lazy(() => import('./pages/PassengerDemandPage'));
const FareOptimizationPage = lazy(() => import('./pages/FareOptimizationPage'));
const SeatInventoryPage = lazy(() => import('./pages/SeatInventoryPage'));
const RevenueForecastingPage = lazy(() => import('./pages/RevenueForecastingPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      <span className="text-xs font-semibold">Loading module...</span>
    </div>
  );
}

function DashboardContent() {
  const { activeTab } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'revenue':
        return <RevenueAnalyticsPage />;
      case 'tickets':
        return <TicketSalesPage />;
      case 'routes':
        return <RoutePerformancePage />;
      case 'flights':
        return <FlightPerformancePage />;
      case 'demand':
        return <PassengerDemandPage />;
      case 'fare':
        return <FareOptimizationPage />;
      case 'inventory':
        return <SeatInventoryPage />;
      case 'forecast':
        return <RevenueForecastingPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Global Filter Bar */}
        <GlobalFilterBar />

        {/* Active Page Body with Suspense code splitting */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageFallback />}>
            {renderActivePage()}
          </Suspense>
        </main>
      </div>

      {/* Global Modals */}
      <UploadModal />
      <ExportModal />
      <AuthModal />
      <UserManagementModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
