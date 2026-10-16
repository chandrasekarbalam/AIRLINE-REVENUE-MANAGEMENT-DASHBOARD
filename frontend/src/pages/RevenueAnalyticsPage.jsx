import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Plane,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function RevenueAnalyticsPage() {
  const {
    getFilterParams,
    currency,
    currencySymbol,
    formatCurrency,
    formatNumber,
    refreshKey,
    setIsExportModalOpen
  } = useApp();

  const [interval, setInterval] = useState('daily'); // daily, weekly, monthly
  const [metric, setMetric] = useState('revenue');   // revenue, tickets, average_fare
  const [trends, setTrends] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [routeSort, setRouteSort] = useState('revenue');
  const [classData, setClassData] = useState(null);
  const [periodData, setPeriodData] = useState(null);
  const [flightsData, setFlightsData] = useState({ flights: [], total: 0 });
  const [flightPage, setFlightPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const [tRes, rRes, cRes, pRes, fRes] = await Promise.all([
          api.getRevenueTrends({ ...params, interval, metric }),
          api.getRevenueByRoute({ ...params, sort_by: routeSort }),
          api.getRevenueByClass(params),
          api.getRevenueByPeriod(params),
          api.getRevenueByFlight({ ...params, limit: 15, offset: flightPage * 15 })
        ]);

        setTrends(tRes.data || []);
        setRoutes(rRes || []);
        setClassData(cRes);
        setPeriodData(pRes);
        setFlightsData(fRes);
      } catch (err) {
        console.error('Failed to load revenue analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency, interval, metric, routeSort, flightPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Trend Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Revenue Pacing & Temporal Trends</h2>
            <p className="text-xs text-slate-500">Chronological analysis compared to previous equivalent baseline</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Interval buttons */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {['daily', 'weekly', 'monthly'].map((intvl) => (
                <button
                  key={intvl}
                  onClick={() => setInterval(intvl)}
                  className={`px-3 py-1 text-xs font-semibold capitalize rounded-md transition-all ${
                    interval === intvl ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {intvl}
                </button>
              ))}
            </div>

            {/* Metric Toggle */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {[
                { id: 'revenue', label: 'Revenue' },
                { id: 'tickets', label: 'Tickets' },
                { id: 'average_fare', label: 'Avg Fare' }
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
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => (metric === 'tickets' ? val : `${currencySymbol}${val > 1000 ? `${(val/1000).toFixed(0)}k` : val}`)}
              />
              <Tooltip
                formatter={(val, name) => [
                  metric === 'tickets' ? Number(val).toLocaleString() : formatCurrency(val),
                  name === 'revenue' || name === 'tickets' || name === 'average_fare' ? 'Current Period' : 'Prior Period'
                ]}
                labelFormatter={(l) => `Period: ${l}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                name="Current Period"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revGrad)"
              />
              <Area
                type="monotone"
                dataKey={`prior_${metric}`}
                name="Prior Period"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Routes Ranking & Travel Period Day-of-Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Ranking */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Route Revenue Rankings</h3>
              <p className="text-xs text-slate-500">Sorted by financial contribution and demand volume</p>
            </div>
            <select
              value={routeSort}
              onChange={(e) => setRouteSort(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="tickets">Sort by Tickets</option>
              <option value="avg_fare">Sort by Avg Fare</option>
              <option value="load_factor">Sort by Load Factor</option>
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={routes.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 45, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => routeSort === 'revenue' ? `${currencySymbol}${(val/1000).toFixed(0)}k` : val}
                />
                <YAxis
                  dataKey="route_code"
                  type="category"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 'bold' }}
                />
                <Tooltip
                  formatter={(val) => routeSort === 'revenue' || routeSort === 'avg_fare' ? formatCurrency(val) : Number(val).toLocaleString()}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar
                  dataKey={routeSort === 'revenue' ? 'total_revenue' : routeSort === 'tickets' ? 'tickets_sold' : routeSort === 'avg_fare' ? 'avg_fare' : 'load_factor'}
                  fill="#0284c7"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of the Week Pacing */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue by Travel Day of Week</h3>
              <p className="text-xs text-slate-500">Distribution of revenue generated across calendar departure days</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
              Network Pattern
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodData?.day_of_week || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day_name"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${currencySymbol}${(val/1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Flight-Level Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Revenue Performance by Flight</h3>
            <p className="text-xs text-slate-500">Granular flight departures, ticket revenues and seat load factor</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Flights CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5">Flight No</th>
                <th className="p-3.5">Airline</th>
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5 text-right">Capacity</th>
                <th className="p-3.5 text-right">Sold</th>
                <th className="p-3.5 text-right">Load Factor</th>
                <th className="p-3.5 text-right">Total Revenue</th>
                <th className="p-3.5 text-right">Avg Fare</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flightsData.flights.map((f) => (
                <tr key={f.flight_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    <span>{f.flight_number}</span>
                  </td>
                  <td className="p-3.5">{f.airline}</td>
                  <td className="p-3.5 font-semibold text-slate-800">{f.route_code}</td>
                  <td className="p-3.5 text-slate-500">{f.departure_date} {f.departure_time}</td>
                  <td className="p-3.5 text-right font-medium">{f.seat_capacity}</td>
                  <td className="p-3.5 text-right font-bold text-slate-800">{f.tickets_sold}</td>
                  <td className="p-3.5 text-right">
                    <span className={`font-bold px-1.5 py-0.5 rounded-md ${
                      f.load_factor >= 85 ? 'bg-emerald-50 text-emerald-700' : f.load_factor < 65 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {f.load_factor}%
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">{formatCurrency(f.total_revenue)}</td>
                  <td className="p-3.5 text-right font-medium">{formatCurrency(f.avg_fare)}</td>
                  <td className="p-3.5 text-center">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : f.status === 'Scheduled' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {flightPage * 15 + 1} to {Math.min((flightPage + 1) * 15, flightsData.total)} of {flightsData.total} flights</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFlightPage(Math.max(0, flightPage - 1))}
              disabled={flightPage === 0}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">Page {flightPage + 1}</span>
            <button
              onClick={() => setFlightPage(flightPage + 1)}
              disabled={(flightPage + 1) * 15 >= flightsData.total}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
