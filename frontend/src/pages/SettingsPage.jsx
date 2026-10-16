import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  Bell,
  Sliders,
  AlertCircle,
  Palette,
  Users,
  KeyRound,
  LogIn
} from 'lucide-react';

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    availableThemes,
    currency,
    setCurrency,
    user,
    setUser,
    triggerRefresh,
    setIsAuthModalOpen,
    setIsUserManagementOpen
  } = useApp();

  const [settings, setSettings] = useState({
    currency: currency,
    exchange_rate_usd_inr: '85.0',
    date_format: 'YYYY-MM-DD',
    time_zone: 'UTC',
    default_report_period: '90',
    low_load_factor_threshold: '0.70',
    high_demand_threshold: '0.85',
    capacity_alert_threshold: '0.92',
    forecast_horizon: '30'
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.getSettings();
        if (data && data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateSettings(settings);
      setCurrency(settings.currency);
      setSaveSuccess(true);
      triggerRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-sky-600" />
            <span>Application Settings & Operational Thresholds</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure theme aesthetics, currency presentation, operational alerting parameters, and access controls
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Visual Appearance & Theme Selector (6 Themes) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-600" />
              <span>Theme Appearance (6 Built-in Themes)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Current Theme: <strong className="text-sky-600 capitalize">{theme.replace('-', ' ')}</strong></span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableThemes.map((t) => (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  theme === t.id
                    ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-xs border border-white mt-0.5"
                  style={{ backgroundColor: t.dot }}
                />
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-800">{t.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Currency & Financial Presentation */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-sky-600" />
            <span>Currency & Financial Presentation</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
              >
                <option value="USD">USD ($) - US Dollars (Standard Aviation Benchmark)</option>
                <option value="INR">INR (₹) - Indian Rupees (Dynamic conversion at ₹85.0)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">Affects all KPI cards, chart axes, and exports</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Exchange Rate (USD to INR)</label>
              <input
                type="number"
                step="0.1"
                value={settings.exchange_rate_usd_inr}
                onChange={(e) => handleChange('exchange_rate_usd_inr', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Configured baseline rate (1 USD = ₹{settings.exchange_rate_usd_inr})</span>
            </div>
          </div>
        </div>

        {/* Operational Alert Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Capacity & Yield Alert Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Low Load Factor Alert</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="0.9"
                  value={settings.low_load_factor_threshold}
                  onChange={(e) => handleChange('low_load_factor_threshold', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-600">({Math.round(Number(settings.low_load_factor_threshold) * 100)}%)</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Triggers low booking pace advisory</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">High Demand Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="0.95"
                  value={settings.high_demand_threshold}
                  onChange={(e) => handleChange('high_demand_threshold', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-600">({Math.round(Number(settings.high_demand_threshold) * 100)}%)</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Classifies strong demand routes</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Capacity Saturation Alert</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.7"
                  max="0.99"
                  value={settings.capacity_alert_threshold}
                  onChange={(e) => handleChange('capacity_alert_threshold', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-600">({Math.round(Number(settings.capacity_alert_threshold) * 100)}%)</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Alerts for imminent sell-out</span>
            </div>
          </div>
        </div>

        {/* Reporting & Forecasting Defaults */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>Forecasting & Date Presets</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Reporting Range</label>
              <select
                value={settings.default_report_period}
                onChange={(e) => handleChange('default_report_period', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
              >
                <option value="30">Last 30 Days</option>
                <option value="60">Last 60 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 180 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Forecast Horizon</label>
              <select
                value={settings.forecast_horizon}
                onChange={(e) => handleChange('forecast_horizon', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
              >
                <option value="7">7 Days Ahead</option>
                <option value="30">30 Days Ahead</option>
                <option value="90">90 Days Ahead</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date Presentation Format</label>
              <select
                value={settings.date_format}
                onChange={(e) => handleChange('date_format', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
              >
                <option value="YYYY-MM-DD">ISO 8601 (YYYY-MM-DD)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Role & Administration Management Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Current Authentication Session</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{user.full_name}</span>
              <span className="text-xs text-slate-400 font-normal">(@{user.username})</span>
            </div>
            <div className="text-xs text-slate-400">
              Assigned Role: <strong className="text-slate-200 capitalize">{user.role ? user.role.replace('_', ' ') : 'Guest'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Switch Account</span>
            </button>

            {user.role === 'administrator' && (
              <button
                type="button"
                onClick={() => setIsUserManagementOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors shadow-xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage Users & Roles</span>
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
