import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  LineChart as LineChartIcon,
  Calendar,
  Sparkles,
  Download,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Table
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function RevenueForecastingPage() {
  const {
    currency,
    currencySymbol,
    formatCurrency,
    formatNumber,
    refreshKey,
    setIsExportModalOpen
  } = useApp();

  const [horizon, setHorizon] = useState(30); // 7, 30, 90
  const [metric, setMetric] = useState('revenue'); // revenue, tickets, average_fare
  const [route, setRoute] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [routesList, setRoutesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      try {
        const [fcRes, rRes] = await Promise.all([
          api.getForecast({ horizon_days: horizon, metric, route: route || undefined, currency }),
          api.getRoutePerformance({ currency })
        ]);
        setForecastData(fcRes);
        setRoutesList(rRes || []);
      } catch (err) {
        console.error('Forecast error', err);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, [horizon, metric, route, currency, refreshKey]);

  // Combine historical and forecast for unified timeline display
  const chartData = [];
  if (forecastData && forecastData.historical) {
    forecastData.historical.forEach((h) => {
      chartData.push({
        date: h.date,
        actual: h.actual_value,
        forecast: null,
        lower: null,
        upper: null,
        type: 'actual'
      });
    });

    if (forecastData.forecast) {
      forecastData.forecast.forEach((f) => {
        chartData.push({
          date: f.date,
          actual: null,
          forecast: f.forecast_value,
          lower: f.lower_bound,
          upper: f.upper_bound,
          type: 'forecast'
        });
      });
    }
  }

  const perf = forecastData?.performance_metrics || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Forecast Controls & Model Configuration Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Time-Series Revenue & Demand Forecasting</span>
            </h2>
            <p className="text-xs text-slate-500">
              Double exponential smoothing (Holt's Linear Model) with 7-day cyclical seasonality and 95% prediction intervals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {[
                { id: 'revenue', label: 'Revenue' },
                { id: 'tickets', label: 'Ticket Demand' },
                { id: 'average_fare', label: 'Average Fare' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    metric === m.id ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Horizon Selector */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {[7, 30, 90].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    horizon === h ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>

            {/* Route filter */}
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Network Routes</option>
              {routesList.map((r) => (
                <option key={r.route_code} value={r.route_code}>
                  {r.route_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Evaluation Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Forecast Model</span>
            <span className="text-xs font-bold text-slate-900 block mt-1">Holt Linear Exponential</span>
            <span className="text-[10px] text-slate-400">α=0.35, β=0.15 + Seasonality</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Out-of-Sample MAE</span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {metric === 'tickets' ? perf.mae : formatCurrency(perf.mae)}
            </span>
            <span className="text-[10px] text-slate-400">Mean Absolute Error</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Out-of-Sample RMSE</span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {metric === 'tickets' ? perf.rmse : formatCurrency(perf.rmse)}
            </span>
            <span className="text-[10px] text-slate-400">Root Mean Squared Error</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Validation Methodology</span>
            <span className="text-xs font-bold text-slate-900 block mt-1">Chronological Holdout</span>
            <span className="text-[10px] text-slate-400">No data leakage or lookahead</span>
          </div>
        </div>
      </div>

      {/* 2. Main Forecast Chart with Confidence Intervals */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historical Actuals vs {horizon}-Day Forward Forecast</h3>
            <p className="text-xs text-slate-500">
              Solid blue indicates actual historical results; dashed cyan indicates model forecast with shaded 95% confidence bounds
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-800" />
              <span>Historical Actual</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-500 border-dashed" />
              <span>Projected Forecast</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => (val ? val.slice(5) : '')}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => metric === 'tickets' ? val : `${currencySymbol}${(val/1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val, name) => [
                  metric === 'tickets' ? Number(val).toLocaleString() : formatCurrency(val),
                  name
                ]}
                labelFormatter={(l) => `Date: ${l}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              {/* Actual historical line */}
              <Line
                type="monotone"
                dataKey="actual"
                name="Historical Actual"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
              />
              {/* Forecast projection line */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast Projection"
                stroke="#0284c7"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 2 }}
              />
              {/* Upper & lower prediction bounds */}
              <Area
                type="monotone"
                dataKey="upper"
                name="Upper 95% Bound"
                stroke="none"
                fill="#38bdf8"
                fillOpacity={0.15}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Daily Forecast Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Projected Daily Ledger</h3>
            <p className="text-xs text-slate-500">Day-by-day forecasted point estimates and lower/upper bounds</p>
          </div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Forecast CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-100">
              <tr>
                <th className="p-3">Horizon Day</th>
                <th className="p-3">Target Date</th>
                <th className="p-3 text-right">Forecast Estimate</th>
                <th className="p-3 text-right">Lower Bound (95%)</th>
                <th className="p-3 text-right">Upper Bound (95%)</th>
                <th className="p-3 text-right">Spread Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecastData?.forecast?.map((f) => (
                <tr key={f.horizon_day} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-semibold text-sky-700">Day +{f.horizon_day}</td>
                  <td className="p-3 text-slate-800 font-medium">{f.date}</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {metric === 'tickets' ? formatNumber(f.forecast_value) : formatCurrency(f.forecast_value)}
                  </td>
                  <td className="p-3 text-right text-slate-500">
                    {metric === 'tickets' ? formatNumber(f.lower_bound) : formatCurrency(f.lower_bound)}
                  </td>
                  <td className="p-3 text-right text-slate-500">
                    {metric === 'tickets' ? formatNumber(f.upper_bound) : formatCurrency(f.upper_bound)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    ± {metric === 'tickets' ? formatNumber(round(f.upper_bound - f.forecast_value)) : formatCurrency(round(f.upper_bound - f.forecast_value))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function round(val) {
  return Math.round(val * 100) / 100;
}
