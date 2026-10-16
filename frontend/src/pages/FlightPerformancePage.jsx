import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Plane,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function FlightPerformancePage() {
  const {
    getFilterParams,
    currency,
    formatCurrency,
    formatNumber,
    refreshKey,
    setIsExportModalOpen
  } = useApp();

  const [flights, setFlights] = useState([]);
  const [totalFlights, setTotalFlights] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const res = await api.getFlightPerformance({
          ...params,
          limit: 25,
          offset: page * 25
        });
        setFlights(res.flights || []);
        setTotalFlights(res.total || 0);
      } catch (err) {
        console.error('Failed to load flight performance', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency, page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Flight Performance Scatter Distribution: Load Factor vs Revenue */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Flight Revenue vs Seat Utilization Scatter</h2>
            <p className="text-xs text-slate-500">
              Each bubble represents an individual flight departure (X: Load Factor %, Y: Gross Revenue)
            </p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
            {totalFlights} Total Operations
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="load_factor"
                name="Load Factor"
                unit="%"
                domain={[40, 100]}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="total_revenue"
                name="Revenue"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `${val > 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(val, name) => [
                  name === 'Revenue' ? formatCurrency(val) : `${val}%`,
                  name
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Scatter name="Flights" data={flights} fill="#0284c7">
                {flights.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.load_factor >= 85 ? '#10b981' : entry.load_factor < 65 ? '#f43f5e' : '#0284c7'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Flight Operations Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scheduled & Completed Flights</h3>
            <p className="text-xs text-slate-500">Aircraft equipment, capacities, seats sold and financial yields</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Flights Report</span>
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
                <th className="p-3.5">Departure Date</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Aircraft</th>
                <th className="p-3.5 text-right">Capacity</th>
                <th className="p-3.5 text-right">Seats Sold</th>
                <th className="p-3.5 text-right">Load Factor</th>
                <th className="p-3.5 text-right">Total Revenue</th>
                <th className="p-3.5 text-right">Avg Fare</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flights.map((f) => (
                <tr key={f.flight_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-bold text-sky-700 flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    <span>{f.flight_number}</span>
                  </td>
                  <td className="p-3.5">{f.airline}</td>
                  <td className="p-3.5 font-semibold text-slate-800">{f.origin} → {f.destination}</td>
                  <td className="p-3.5 text-slate-600">{f.departure_date}</td>
                  <td className="p-3.5 text-slate-500">{f.departure_time}</td>
                  <td className="p-3.5 font-medium">{f.aircraft_type}</td>
                  <td className="p-3.5 text-right font-medium">{f.seat_capacity}</td>
                  <td className="p-3.5 text-right font-bold text-slate-900">{f.tickets_sold}</td>
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
                      f.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : f.status === 'Scheduled'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-rose-100 text-rose-800'
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
          <span>
            Showing {page * 25 + 1} to {Math.min((page + 1) * 25, totalFlights)} of {totalFlights} flights
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * 25 >= totalFlights}
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
