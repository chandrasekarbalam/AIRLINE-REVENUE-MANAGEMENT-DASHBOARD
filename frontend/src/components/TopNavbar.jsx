import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Bell,
  RefreshCw,
  Download,
  Upload,
  Search,
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  Menu,
  ChevronDown,
  Palette,
  Users,
  LogOut,
  LogIn
} from 'lucide-react';

const pageTitles = {
  overview: 'Executive Revenue Overview',
  revenue: 'Interactive Revenue Analytics',
  tickets: 'Ticket Sales Management',
  routes: 'Route Network Performance',
  flights: 'Flight-Level Operations',
  demand: 'Passenger Demand & Booking Curve',
  fare: 'Fare Optimization & What-If Simulator',
  inventory: 'Seat Capacity & Inventory Management',
  forecast: 'Time-Series Revenue Forecasting',
  reports: 'Reports & Export Center',
  settings: 'Application Preferences & Thresholds'
};

export default function TopNavbar({ sidebarOpen, setSidebarOpen }) {
  const {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    availableThemes,
    currency,
    setCurrency,
    dateRangePreset,
    setPresetDateRange,
    filters,
    setFilter,
    triggerRefresh,
    notifications,
    user,
    setUser,
    setIsExportModalOpen,
    setIsUploadModalOpen,
    setIsAuthModalOpen,
    setIsUserManagementOpen
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Debounced search state
  const [searchInput, setSearchInput] = useState(filters.search || '');
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const themeRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSignOut = () => {
    api.logout();
    setUser({ username: 'guest', role: 'guest', full_name: 'Guest Viewer' });
    setShowProfileMenu(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>AeroRevenue</span>
            <span>/</span>
            <span className="text-slate-600 capitalize">{activeTab}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
            {pageTitles[activeTab] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Center: Search & Date Presets */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Date presets */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
            { id: '180d', label: '180D' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPresetDateRange(preset.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                dateRangePreset === preset.id
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Global Search Input with Debouncing */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search (e.g. AI-101, DEL-BOM, PNR)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            title="Search by Flight (AI-101), Route (DEL-BOM), Passenger Name, or PNR Reference"
          />
        </div>
      </div>

      {/* Right: Theme, Currency, Actions, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Theme Selector Popover (6 Themes) */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center gap-1.5"
            title="Change Theme (6 Themes Available)"
          >
            <Palette className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Aero Themes (6 Styles)
              </div>
              <div className="space-y-1 mt-1">
                {availableThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                      theme === t.id
                        ? 'bg-sky-50 text-sky-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white/40"
                        style={{ backgroundColor: t.dot }}
                      />
                      <div className="text-left">
                        <div className="leading-tight">{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{t.desc}</div>
                      </div>
                    </div>
                    {theme === t.id && <CheckCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
              currency === 'USD'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch display to US Dollars ($)"
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
              currency === 'INR'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch display to Indian Rupees (₹)"
          >
            INR (₹)
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefreshClick}
          className="p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100 border border-slate-200/80 transition-all"
          title="Refresh Dataset"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
        </button>

        {/* Quick Export report */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs"
          title="Export CSV or Excel Report"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100 border border-slate-200/80 transition-all relative"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live System Alerts</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  {notifications.length} Active
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No critical capacity or revenue alerts detected.
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{n.desc}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
              {user.username ? user.username[0] : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user.username}</div>
              <div className="text-[10px] text-sky-600 font-semibold capitalize flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                <span>{user.role ? user.role.replace('_', ' ') : 'Guest'}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-bold text-xs text-slate-800">{user.full_name}</div>
                <div className="text-[11px] text-slate-500">{user.email || `${user.username}@aeroanalytics.com`}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 capitalize">
                  {user.role ? user.role.replace('_', ' ') : 'Guest'}
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  <LogIn className="w-3.5 h-3.5 text-sky-600" />
                  <span>Switch Role / Sign In...</span>
                </button>

                {user.role === 'administrator' && (
                  <button
                    onClick={() => {
                      setIsUserManagementOpen(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Manage Users & Roles...</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>System Preferences</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
