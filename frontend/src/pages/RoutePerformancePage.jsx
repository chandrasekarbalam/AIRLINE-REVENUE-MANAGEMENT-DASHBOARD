import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Compass,
  ArrowUpDown,
  Download,
  CheckSquare,
  Square,
  Columns,
  Layers,
  Search,
  Plane,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function RoutePerformancePage() {
  const {
    getFilterParams,
    currency,
    currencySymbol,
    formatCurrency,
    formatNumber,
    refreshKey,
    setIsExportModalOpen
  } = useApp();

  const [routes, setRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState(['DEL-BOM', 'BOM-BLR']);
  const [comparisonData, setComparisonData] = useState([]);
  const [sortBy, setSortBy] = useState('total_revenue');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const rData = await api.getRoutePerformance(params);
        setRoutes(rData || []);

        if (selectedRoutes.length > 0) {
          const cData = await api.getRouteComparison(selectedRoutes, params);
          setComparisonData(cData.comparison || []);
        }
      } catch (e) {
        console.error('Route performance load error', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency, selectedRoutes.join(',')]);

  const toggleRouteSelection = (code) => {
    if (selectedRoutes.includes(code)) {
      if (selectedRoutes.length > 1) {
        setSelectedRoutes(selectedRoutes.filter((r) => r !== code));
      }
    } else {
      if (selectedRoutes.length < 5) {
        setSelectedRoutes([...selectedRoutes, code]);
      }
    }
  };

  const filteredRoutes = routes.filter((r) =>
    r.route_code.toLowerCase().includes(search.toLowerCase()) ||
    r.origin.toLowerCase().includes(search.toLowerCase()) ||
    r.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Interactive Route Comparison Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Columns className="w-4 h-4 text-sky-600" />
              <span>Multi-Route Benchmarking & Comparison</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select 2 to 5 routes to evaluate load factors, yields, and passenger revenue pacing side-by-side
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 font-semibold mr-1">Selected:</span>
              {routes.slice(0, 8).map((r) => {
                const isSelected = selectedRoutes.includes(r.route_code);
                return (
                  <button
                    key={r.route_code}
                    onClick={() => toggleRouteSelection(r.route_code)}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{r.route_code}</span>
                    {isSelected && <span className="text-[10px] bg-white/20 px-1 rounded-full">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Example Comparison Presets */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200/80">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">Try Benchmark Preset:</span>
          <button
            type="button"
            onClick={() => setSelectedRoutes(['DEL-BOM', 'BOM-BLR', 'DEL-BLR'])}
            className="px-2 py-0.5 rounded-md bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 font-medium shrink-0 transition-colors"
          >
            Metros: DEL-BOM vs BOM-BLR vs DEL-BLR
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoutes(['DEL-DXB', 'BOM-DXB'])}
            className="px-2 py-0.5 rounded-md bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 font-medium shrink-0 transition-colors"
          >
            Gulf Corridor: DEL-DXB vs BOM-DXB
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoutes(['DEL-LHR', 'DEL-JFK', 'DEL-SIN'])}
            className="px-2 py-0.5 rounded-md bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 font-medium shrink-0 transition-colors"
          >
            International: London (LHR) vs New York (JFK) vs Singapore (SIN)
          </button>
        </div>

        {/* Side-by-Side Comparison Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Revenue & Demand Comparison */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Total Revenue & Passenger Volume
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="route_code" tickLine={false} tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `${currencySymbol}${(val/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="total_revenue" name="Total Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Load Factor & RASK Comparison */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Load Factor (%) & Seat Efficiency
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="route_code" tickLine={false} tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis domain={[0, 100]} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val) => `${val}%`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="load_factor" name="Load Factor" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ranked Network Route Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Network Route Performance Ranking</h3>
            <p className="text-xs text-slate-500">Comprehensive table ranking routes by commercial yield, distance, and load factors</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter route (e.g. DEL-BOM, Dubai)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-sky-500"
                title="Filter routes by code (DEL-BOM) or destination city"
              />
            </div>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Origin / Destination</th>
                <th className="p-3.5 text-right">Distance</th>
                <th className="p-3.5 text-right">Flights</th>
                <th className="p-3.5 text-right">Tickets Sold</th>
                <th className="p-3.5 text-right">Seat Capacity</th>
                <th className="p-3.5 text-right">Load Factor</th>
                <th className="p-3.5 text-right">Total Revenue</th>
                <th className="p-3.5 text-right">Avg Fare</th>
                <th className="p-3.5 text-right">RASK</th>
                <th className="p-3.5 text-right">Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutes.map((r) => (
                <tr key={r.route_code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-bold text-sky-700 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    <span>{r.route_code}</span>
                  </td>
                  <td className="p-3.5 text-slate-600">{r.origin} → {r.destination}</td>
                  <td className="p-3.5 text-right font-medium">{r.distance_km} km</td>
                  <td className="p-3.5 text-right font-medium">{r.flights_count}</td>
                  <td className="p-3.5 text-right font-bold text-slate-800">{formatNumber(r.tickets_sold)}</td>
                  <td className="p-3.5 text-right font-medium text-slate-500">{formatNumber(r.seat_capacity)}</td>
                  <td className="p-3.5 text-right">
                    <span className={`font-bold px-1.5 py-0.5 rounded-md ${
                      r.load_factor >= 85 ? 'bg-emerald-50 text-emerald-700' : r.load_factor < 68 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {r.load_factor}%
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">{formatCurrency(r.total_revenue)}</td>
                  <td className="p-3.5 text-right font-medium">{formatCurrency(r.avg_fare)}</td>
                  <td className="p-3.5 text-right font-mono text-slate-600">{currencySymbol}{r.rask}</td>
                  <td className="p-3.5 text-right font-mono text-slate-600">{currencySymbol}{r.yield}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
