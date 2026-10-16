import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Ticket,
  CheckCircle,
  XCircle,
  RotateCcw,
  DollarSign,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Plane,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function TicketSalesPage() {
  const {
    getFilterParams,
    currency,
    formatCurrency,
    formatNumber,
    refreshKey,
    setIsExportModalOpen
  } = useApp();

  const [ticketsData, setTicketsData] = useState({ tickets: [], total: 0 });
  const [channelData, setChannelData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const [tRes, cRes, sRes] = await Promise.all([
          api.getTickets({ ...params, search: searchQuery, limit: 20, offset: page * 20 }),
          api.getChannelDistribution(params),
          api.getDashboardSummary(params)
        ]);

        setTicketsData(tRes);
        setChannelData(cRes);
        setSummaryData(sRes);
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency, page, searchQuery]);

  const b = summaryData?.breakdown || {};
  const m = summaryData?.metrics || {};

  const channelColors = ['#0284c7', '#38bdf8', '#1e3a8a', '#d97706', '#64748b'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Ticket Sales KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tickets Sold</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatNumber(m.tickets_sold?.value)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Confirmed issues</div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Confirmed</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{formatNumber(b.confirmed_tickets)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Completed flights</div>
        </div>

        <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Cancelled</div>
          <div className="text-xl font-bold text-rose-800 mt-1">{formatNumber(b.cancelled_tickets)}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Pre-departure voids</div>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Refunded</div>
          <div className="text-xl font-bold text-amber-800 mt-1">{formatNumber(b.refunded_tickets)}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Credited back</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Selling Price</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(m.average_fare?.value)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Net base fare</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Ticket Sales</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(m.total_revenue?.value)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Selected period</div>
        </div>
      </div>

      {/* 2. Channel Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Sales Volume by Channel</h3>
          <p className="text-xs text-slate-500 mb-4">Direct vs indirect agency revenue distribution</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="channel" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name) => [name === 'revenue' ? formatCurrency(val) : Number(val).toLocaleString(), name === 'revenue' ? 'Revenue' : 'Bookings']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown List */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Channel Contribution</h3>
            <p className="text-xs text-slate-500 mb-4">Channel share of total gross receipts</p>

            <div className="space-y-3">
              {channelData.map((c, i) => (
                <div key={c.channel} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{c.channel}</span>
                    <span className="text-slate-900">{c.percentage}% ({formatCurrency(c.revenue)})</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${c.percentage}%`, backgroundColor: channelColors[i % channelColors.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            Direct channels (Web + App) reduce GDS distribution distribution surcharges by ~3.2%.
          </div>
        </div>
      </div>

      {/* 3. Detailed Ticket Transactions Ledger */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ticket Ledger & Audit</h3>
            <p className="text-xs text-slate-500">Live individual ticket transactions with taxes, discounts and channel</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Example Chips */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-semibold text-[10px]">Try:</span>
              {['AI-101', 'DEL-BOM', 'Business', 'Direct Web', 'Sharma'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => { setSearchQuery(chip); setPage(0); }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-md border border-slate-200 transition-colors"
                  title={`Filter by "${chip}"`}
                >
                  {chip}
                </button>
              ))}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setPage(0); }}
                  className="text-rose-600 hover:underline text-[10px] ml-1 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Input with Explicit Examples */}
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. AI-101, DEL-BOM, TK-AI-0001, Sharma..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                title="Search tickets by flight number (e.g. AI-101), route (e.g. DEL-BOM), ticket number, or passenger name"
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
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Booking Ref</th>
                <th className="p-3">Passenger</th>
                <th className="p-3">Flight</th>
                <th className="p-3">Route</th>
                <th className="p-3">Class</th>
                <th className="p-3">Travel Date</th>
                <th className="p-3 text-right">Fare</th>
                <th className="p-3 text-right">Taxes</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Channel</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ticketsData.tickets.map((t) => (
                <tr key={t.ticket_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-bold text-sky-700">{t.ticket_number}</td>
                  <td className="p-3 font-mono text-slate-600">{t.booking_reference}</td>
                  <td className="p-3 font-medium text-slate-900">{t.passenger_name}</td>
                  <td className="p-3 font-semibold text-slate-800">{t.flight_number}</td>
                  <td className="p-3">{t.route_code}</td>
                  <td className="p-3 font-medium">{t.booking_class}</td>
                  <td className="p-3 text-slate-500">{t.travel_date}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(t.fare_amount)}</td>
                  <td className="p-3 text-right text-slate-400">{formatCurrency(t.tax_amount)}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(t.total_price)}</td>
                  <td className="p-3 text-slate-600">{t.sales_channel}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.ticket_status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.ticket_status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.ticket_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {page * 20 + 1} to {Math.min((page + 1) * 20, ticketsData.total)} of {ticketsData.total} tickets
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
              disabled={(page + 1) * 20 >= ticketsData.total}
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
