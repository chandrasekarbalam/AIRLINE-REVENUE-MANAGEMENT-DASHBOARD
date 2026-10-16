import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Percent,
  Layers,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function PassengerDemandPage() {
  const {
    getFilterParams,
    currency,
    formatCurrency,
    formatNumber,
    refreshKey
  } = useApp();

  const [demandData, setDemandData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const data = await api.getDemandAnalysis(params);
        setDemandData(data);
      } catch (err) {
        console.error('Failed to load demand analysis', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency]);

  const curve = demandData?.booking_curve || [];
  const leadTimes = demandData?.lead_time_distribution || [];
  const capVsDemand = demandData?.capacity_vs_demand || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Booking Curve: Cumulative Booking Pace towards Departure */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Cumulative Booking Curve (Booking Pace Pacing)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tracking how passenger reservations accumulate from 60 days before departure down to departure day (Day 0)
            </p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
            Pacing Curve
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="days_before_departure"
                reversed={true}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `D-${val}`}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val, name) => [
                  name === 'Cumulative Bookings' ? Number(val).toLocaleString() : `${val}%`,
                  name
                ]}
                labelFormatter={(l) => `Days before flight: ${l} days`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="cumulative_bookings"
                name="Cumulative Bookings"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#curveGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Lead Time Brackets & Capacity vs Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Lead Time Brackets */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Booking Lead Time Brackets</h3>
          <p className="text-xs text-slate-500 mb-4">Volume and average ticket price by purchase window</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimes} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="lead_bracket" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'ticket_count' ? Number(val).toLocaleString() : formatCurrency(val),
                    name === 'ticket_count' ? 'Tickets Sold' : 'Average Fare'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="ticket_count" name="ticket_count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seat Capacity vs Passenger Demand */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Available Seat Capacity vs Demand</h3>
          <p className="text-xs text-slate-500 mb-4">Daily total seats scheduled vs actual seats booked</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={capVsDemand} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v ? v.slice(5) : ''} />
                <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name) => [Number(val).toLocaleString(), name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="seat_capacity" name="Available Seats" stroke="#94a3b8" fill="#e2e8f0" fillOpacity={0.6} />
                <Area type="monotone" dataKey="passenger_demand" name="Seats Booked" stroke="#0284c7" fill="#0284c7" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
