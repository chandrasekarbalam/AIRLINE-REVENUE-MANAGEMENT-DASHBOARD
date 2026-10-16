import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AppContext = createContext();

export const AVAILABLE_THEMES = [
  { id: 'aero-light', name: 'Aero Light', desc: 'Crisp aviation daylight', dot: '#0284c7' },
  { id: 'midnight', name: 'Midnight Aviation', desc: 'Cockpit dark navy', dot: '#38bdf8' },
  { id: 'ocean', name: 'Ocean Blue', desc: 'Nautical azure & turquoise', dot: '#06b6d4' },
  { id: 'emerald', name: 'Emerald Finance', desc: 'Wall Street slate & emerald', dot: '#10b981' },
  { id: 'purple', name: 'Royal Purple', desc: 'Executive luxury indigo', dot: '#a855f7' },
  { id: 'high-contrast', name: 'High Contrast', desc: 'Accessible black & white', dot: '#facc15' },
];

export function AppProvider({ children }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Theme Management (6 Themes)
  const [theme, setTheme] = useState(() => localStorage.getItem('airline_theme') || 'aero-light');

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('airline_theme', theme);
  }, [theme]);

  // Currency
  const [currency, setCurrency] = useState(() => localStorage.getItem('airline_currency') || 'USD');

  // User Profile / Auth
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('airline_user');
      return stored ? JSON.parse(stored) : { username: 'analyst', role: 'analyst', full_name: 'Revenue Analyst' };
    } catch (e) {
      return { username: 'analyst', role: 'analyst', full_name: 'Revenue Analyst' };
    }
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Global Date Range (default: last 90 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultStartStr = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateRangePreset, setDateRangePreset] = useState('90d'); // 7d, 30d, 90d, 180d, custom
  const [filters, setFilters] = useState({
    startDate: defaultStartStr,
    endDate: todayStr,
    origin: '',
    destination: '',
    route: '',
    flightNumber: '',
    bookingClass: '',
    ticketStatus: '',
    salesChannel: '',
    airline: '',
    search: '',
  });

  // Filter Dropdown Options
  const [filterOptions, setFilterOptions] = useState({
    airports: [],
    routes: [],
    airlines: [],
    flight_numbers: [],
    booking_classes: [],
    statuses: [],
    channels: []
  });

  // Global Refresh Trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Load filter options on startup
  useEffect(() => {
    async function loadOptions() {
      try {
        const opts = await api.getFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch operational notifications
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const inv = await api.getInventorySummary({
          start_date: filters.startDate,
          end_date: filters.endDate
        });
        const notes = [];
        if (inv.alerts?.high_capacity_count > 0) {
          notes.push({
            id: 'cap_alert',
            type: 'alert',
            title: `${inv.alerts.high_capacity_count} flights approaching capacity`,
            desc: 'Load factor exceeds 90%. Review yield & price adjustments.',
            time: 'Live'
          });
        }
        if (inv.alerts?.low_load_count > 0) {
          notes.push({
            id: 'low_lf_alert',
            type: 'warning',
            title: `${inv.alerts.low_load_count} flights with low booking pace`,
            desc: 'Load factor below 65%. Dynamic promotional pricing recommended.',
            time: 'Live'
          });
        }
        setNotifications(notes);
      } catch (e) {
        console.error('Alerts error', e);
      }
    }
    fetchAlerts();
  }, [refreshKey, filters.startDate, filters.endDate]);

  const setCurrencyChoice = (newCur) => {
    setCurrency(newCur);
    localStorage.setItem('airline_currency', newCur);
  };

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `${currencySymbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString();
  };

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setPresetDateRange = (preset) => {
    setDateRangePreset(preset);
    const end = new Date().toISOString().split('T')[0];
    let start;
    if (preset === '7d') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (preset === '30d') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (preset === '90d') {
      start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (preset === '180d') {
      start = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    if (start) {
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    }
  };

  const resetFilters = () => {
    setDateRangePreset('90d');
    setFilters({
      startDate: defaultStartStr,
      endDate: todayStr,
      origin: '',
      destination: '',
      route: '',
      flightNumber: '',
      bookingClass: '',
      ticketStatus: '',
      salesChannel: '',
      airline: '',
      search: '',
    });
  };

  // Calculate active filter count (excluding default dates)
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'startDate' || k === 'endDate') return false;
    return Boolean(v);
  }).length;

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getFilterParams = () => {
    return {
      start_date: filters.startDate,
      end_date: filters.endDate,
      origin: filters.origin || undefined,
      destination: filters.destination || undefined,
      route: filters.route || undefined,
      flight_number: filters.flightNumber || undefined,
      booking_class: filters.bookingClass || undefined,
      ticket_status: filters.ticketStatus || undefined,
      sales_channel: filters.salesChannel || undefined,
      airline: filters.airline || undefined,
      search: filters.search || undefined,
      currency: currency
    };
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      theme,
      setTheme,
      availableThemes: AVAILABLE_THEMES,
      currency,
      setCurrency: setCurrencyChoice,
      currencySymbol,
      formatCurrency,
      formatNumber,
      filters,
      setFilter,
      resetFilters,
      activeFilterCount,
      dateRangePreset,
      setPresetDateRange,
      filterOptions,
      getFilterParams,
      user,
      setUser,
      refreshKey,
      triggerRefresh,
      notifications,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isUserManagementOpen,
      setIsUserManagementOpen,
      isUploadModalOpen,
      setIsUploadModalOpen,
      isExportModalOpen,
      setIsExportModalOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
