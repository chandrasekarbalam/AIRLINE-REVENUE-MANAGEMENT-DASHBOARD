import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plane,
  Download,
  Search,
  Filter,
  Flame,
  BatteryLow
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function SeatInventoryPage() {
  const {
    getFilterParams,
    currency,
    formatNumber,
    refreshKey,
    setIsExportModalOpen
  } = useApp();

  const [inventory, setInventory] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const [invRes, rRes] = await Promise.all([
          api.getInventorySummary(params),
          api.getRevenueByRoute(params)
        ]);
        setInventory(invRes);
        setRoutes(rRes || []);
      } catch (err) {
        console.error('Inventory error', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency]);

  const s = inventory?.summary || {};
  const alerts = inventory?.alerts || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Seat Capacity</span>
          <span className="text-2xl font-extrabold text-slate-900 block mt-1">{formatNumber(s.total_capacity)}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled seat inventory</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Seats Booked</span>
          <span className="text-2xl font-extrabold text-sky-700 block mt-1">{formatNumber(s.total_booked)}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Confirmed passenger seats</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Remaining Available</span>
          <span className="text-2xl font-extrabold text-slate-700 block mt-1">{formatNumber(s.total_available)}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Unsold seat inventory</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Network Load Factor</span>
          <span className="text-2xl font-extrabold text-emerald-700 block mt-1">{s.avg_load_factor}%</span>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${s.avg_load_factor}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Critical Operational Alerts: High Saturation vs Low Booking Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saturation Alerts (>90% Capacity) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900">Flights Approaching Capacity (&gt; 90% Sold)</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {alerts.high_capacity_count} Flights
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Flights near sell-out. Immediate action: close promotional buckets and yield up remaining seats.
          </p>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {alerts.high_capacity_flights?.map((f) => (
              <div key={f.flight_id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Plane className="w-4 h-4 text-rose-600" />
                  <div>
                    <span className="font-bold text-slate-900">{f.flight_number}</span> ({f.route_code})
                    <span className="text-slate-500 block text-[11px]">{f.departure_date} at {f.departure_time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700">{f.load_factor}% Sold</span>
                  <span className="text-[10px] text-slate-500 block">{f.available_seats} seats left of {f.seat_capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Booking Pace Alerts (<65% Capacity) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BatteryLow className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Low Booking Pace Pacing (&lt; 65% Sold)</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {alerts.low_load_count} Flights
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Underperforming inventory. Action: release dynamic discounts or flash promotional inventory.
          </p>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {alerts.low_load_flights?.map((f) => (
              <div key={f.flight_id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Plane className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-bold text-slate-900">{f.flight_number}</span> ({f.route_code})
                    <span className="text-slate-500 block text-[11px]">{f.departure_date} at {f.departure_time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700">{f.load_factor}% Sold</span>
                  <span className="text-[10px] text-slate-500 block">{f.available_seats} seats unallocated</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Capacity Utilization by Route Chart */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Capacity Utilization by Route</h3>
        <p className="text-xs text-slate-500 mb-4">Seat capacity booked vs remaining available across active route sectors</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={routes.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="route_code" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                formatter={(val, name) => [Number(val).toLocaleString(), name === 'tickets_sold' ? 'Seats Booked' : 'Total Capacity']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="seat_capacity" name="seat_capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tickets_sold" name="tickets_sold" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
