import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import KpiCard from '../components/KpiCard';
import {
  DollarSign,
  Ticket,
  Users,
  Percent,
  TrendingUp,
  Compass,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Sliders,
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  Receipt,
  RotateCcw,
  BookOpen,
  Building2,
  Share2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

export default function OverviewPage() {
  const {
    getFilterParams,
    currency,
    currencySymbol,
    formatCurrency,
    formatNumber,
    refreshKey,
    setActiveTab,
    setIsUploadModalOpen,
    setIsExportModalOpen
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [classData, setClassData] = useState(null);
  const [airlineData, setAirlineData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trendMetric, setTrendMetric] = useState('revenue'); // revenue, tickets, average_fare

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = getFilterParams();
        const [sumRes, trendRes, routeRes, clsRes, airRes, chanRes, insRes] = await Promise.all([
          api.getDashboardSummary(params),
          api.getRevenueTrends({ ...params, interval: 'daily' }),
          api.getRevenueByRoute({ ...params, sort_by: 'revenue', order: 'desc' }),
          api.getRevenueByClass(params),
          api.getRevenueByAirline(params),
          api.getRevenueByChannel(params),
          api.getDashboardInsights(params)
        ]);

        setSummaryData(sumRes);
        setTrendsData(trendRes.data || []);
        setRoutesData((routeRes || []).slice(0, 6));
        setClassData(clsRes);
        setAirlineData(airRes || []);
        setChannelData(chanRes || []);
        setInsights(insRes || []);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, currency]);

  if (loading && !summaryData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <span className="text-xs font-semibold">Loading executive revenue intelligence...</span>
      </div>
    );
  }

  const m = summaryData?.metrics || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* SECTION 1: Top 6 Financial & Sales KPIs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Revenue & Sales Performance
          </span>
          <span className="text-[11px] text-slate-400">Currency: {currency}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Total Gross Revenue */}
          <KpiCard
            title="Total Revenue"
            value={m.total_revenue?.value}
            formattedValue={formatCurrency(m.total_revenue?.value)}
            priorValue={formatCurrency(m.total_revenue?.prior_value)}
            changePct={m.total_revenue?.change_pct}
            calculation={m.total_revenue?.calculation}
            icon={DollarSign}
          />

          {/* 2. Net Revenue */}
          <KpiCard
            title="Net Revenue"
            value={m.net_revenue?.value}
            formattedValue={formatCurrency(m.net_revenue?.value)}
            priorValue={formatCurrency(m.net_revenue?.prior_value)}
            changePct={m.net_revenue?.change_pct}
            calculation={m.net_revenue?.calculation}
            icon={DollarSign}
          />

          {/* 3. Gross Ticket Sales */}
          <KpiCard
            title="Gross Ticket Sales"
            value={m.gross_ticket_sales?.value}
            formattedValue={formatCurrency(m.gross_ticket_sales?.value)}
            priorValue={formatCurrency(m.gross_ticket_sales?.prior_value)}
            changePct={m.gross_ticket_sales?.change_pct}
            calculation={m.gross_ticket_sales?.calculation}
            icon={Receipt}
          />

          {/* 4. Total Bookings */}
          <KpiCard
            title="Total Bookings"
            value={m.total_bookings?.value}
            formattedValue={formatNumber(m.total_bookings?.value)}
            priorValue={formatNumber(m.total_bookings?.prior_value)}
            changePct={m.total_bookings?.change_pct}
            calculation={m.total_bookings?.calculation}
            icon={BookOpen}
          />

          {/* 5. Total Tickets Sold */}
          <KpiCard
            title="Tickets Sold"
            value={m.tickets_sold?.value}
            formattedValue={formatNumber(m.tickets_sold?.value)}
            priorValue={formatNumber(m.tickets_sold?.prior_value)}
            changePct={m.tickets_sold?.change_pct}
            calculation={m.tickets_sold?.calculation}
            icon={Ticket}
          />

          {/* 6. Total Passengers */}
          <KpiCard
            title="Total Passengers"
            value={m.total_passengers?.value}
            formattedValue={formatNumber(m.total_passengers?.value)}
            priorValue={formatNumber(m.total_passengers?.prior_value)}
            changePct={m.total_passengers?.change_pct}
            calculation={m.total_passengers?.calculation}
            icon={Users}
          />
        </div>
      </div>

      {/* SECTION 2: Operational Efficiency & Unit Economics (7 KPIs) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Unit Economics & Network Efficiency
          </span>
          <span className="text-[11px] text-slate-400">Benchmark Ratios</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 7. Average Ticket Fare */}
          <KpiCard
            title="Avg Ticket Fare"
            value={m.average_fare?.value}
            formattedValue={formatCurrency(m.average_fare?.value)}
            priorValue={formatCurrency(m.average_fare?.prior_value)}
            changePct={m.average_fare?.change_pct}
            calculation={m.average_fare?.calculation}
            icon={TrendingUp}
          />

          {/* 8. Passenger Load Factor */}
          <KpiCard
            title="Load Factor"
            value={m.load_factor?.value}
            formattedValue={`${m.load_factor?.value ?? 0}%`}
            priorValue={`${m.load_factor?.prior_value ?? '—'}%`}
            changePct={m.load_factor?.change_pct}
            calculation={m.load_factor?.calculation}
            icon={Percent}
          />

          {/* 9. RASK */}
          <KpiCard
            title="RASK"
            value={m.rask?.value}
            formattedValue={`${currencySymbol}${m.rask?.value ?? '0.00'}`}
            priorValue={`${currencySymbol}${m.rask?.prior_value ?? '—'}`}
            changePct={m.rask?.change_pct}
            calculation={m.rask?.calculation}
            icon={Compass}
          />

          {/* 10. Yield */}
          <KpiCard
            title="Yield (RPK)"
            value={m.yield?.value}
            formattedValue={`${currencySymbol}${m.yield?.value ?? '0.00'}`}
            priorValue={`${currencySymbol}${m.yield?.prior_value ?? '—'}`}
            changePct={m.yield?.change_pct}
            calculation={m.yield?.calculation}
            icon={DollarSign}
          />

          {/* 11. Conversion Rate */}
          <KpiCard
            title="Conversion Rate"
            value={m.conversion_rate?.value}
            formattedValue={`${m.conversion_rate?.value ?? 0}%`}
            priorValue={`${m.conversion_rate?.prior_value ?? '—'}%`}
            changePct={m.conversion_rate?.change_pct}
            calculation={m.conversion_rate?.calculation}
            icon={CheckCircle2}
          />

          {/* 12. Refund Amount */}
          <KpiCard
            title="Refund Amount"
            value={m.refund_amount?.value}
            formattedValue={formatCurrency(m.refund_amount?.value)}
            priorValue={formatCurrency(m.refund_amount?.prior_value)}
            changePct={m.refund_amount?.change_pct}
            calculation={m.refund_amount?.calculation}
            icon={RotateCcw}
            invertPositive={true}
          />

          {/* 13. Cancellation Rate */}
          <KpiCard
            title="Cancellation Rate"
            value={m.cancellation_rate?.value}
            formattedValue={`${m.cancellation_rate?.value ?? 0}%`}
            priorValue={`${m.cancellation_rate?.prior_value ?? '—'}%`}
            changePct={m.cancellation_rate?.change_pct}
            calculation={m.cancellation_rate?.calculation}
            icon={AlertTriangle}
            invertPositive={true}
          />
        </div>
      </div>

      {/* Main Charts Row: Revenue Trends & Class Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Performance Pacing</h3>
              <p className="text-xs text-slate-500">Daily actuals compared with prior equivalent period</p>
            </div>

            {/* Metric Toggle */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setTrendMetric('revenue')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  trendMetric === 'revenue' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setTrendMetric('tickets')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  trendMetric === 'tickets' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Ticket Volume
              </button>
              <button
                onClick={() => setTrendMetric('average_fare')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  trendMetric === 'average_fare' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Avg Fare
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(val) => (trendMetric === 'tickets' ? val : `${currencySymbol}${val > 1000 ? `${(val/1000).toFixed(0)}k` : val}`)}
                />
                <Tooltip
                  formatter={(val, name) => [
                    trendMetric === 'tickets' ? Number(val).toLocaleString() : `${currencySymbol}${Number(val).toLocaleString()}`,
                    name === 'revenue' ? 'Current Period' : name === 'prior_revenue' ? 'Prior Period' : name
                  ]}
                  labelFormatter={(l) => `Date: ${l}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric}
                  name="Current Period"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#currentGradient)"
                />
                {trendMetric === 'revenue' && (
                  <Area
                    type="monotone"
                    dataKey="prior_revenue"
                    name="Prior Period"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Booking Class (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Revenue by Booking Class</h3>
              <span className="text-xs text-sky-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('revenue')}>
                Details
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Share of wallet across cabin segments</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classData?.classes || []}
                    dataKey="total_revenue"
                    nameKey="booking_class"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {classData?.classes?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cabin Legend */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {classData?.classes?.map((c) => (
              <div key={c.booking_class} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-medium text-slate-700">{c.booking_class}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{c.percentage}%</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">({formatCurrency(c.total_revenue)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Revenue by Airline & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Airline */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                Revenue by Partner Airline
              </h3>
              <p className="text-xs text-slate-500">Gross revenue generated across carrier network</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={airlineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="airline" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                <YAxis
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${currencySymbol}${val > 1000 ? `${(val/1000000).toFixed(1)}M` : val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_revenue" radius={[6, 6, 0, 0]}>
                  {airlineData.map((entry, index) => (
                    <Cell key={`air-cell-${index}`} fill={entry.color || '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-600" />
                Sales Channel Distribution
              </h3>
              <p className="text-xs text-slate-500">Volume and revenue share across distribution channels</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${currencySymbol}${val > 1000 ? `${(val/1000000).toFixed(1)}M` : val}`}
                />
                <YAxis type="category" dataKey="channel" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={100} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell key={`chan-cell-${index}`} fill={entry.color || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Route Rankings & Automated Business Intelligence Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes Ranking */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Revenue Routes</h3>
              <p className="text-xs text-slate-500">Highest gross revenue airport pairs</p>
            </div>
            <button
              onClick={() => setActiveTab('routes')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {routesData.map((r, i) => (
              <div
                key={r.route_code}
                onClick={() => setActiveTab('routes')}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-sky-600 group-hover:text-white text-slate-600 font-bold text-xs flex items-center justify-center transition-colors">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors">
                      {r.origin} → {r.destination}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {r.route_code} • {formatNumber(r.tickets_sold)} tickets sold
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-xs text-slate-900">
                    {formatCurrency(r.total_revenue)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    {r.load_factor}% LF • Avg {formatCurrency(r.avg_fare)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Intelligence Insights */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Automated Revenue Insights</h3>
                  <p className="text-xs text-slate-500">Heuristic rule-based intelligence engine</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                {insights.length} Actionable
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {insights.slice(0, 4).map((ins, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs ${
                    ins.type === 'opportunity'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : ins.type === 'alert'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                      : 'bg-amber-50/60 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      {ins.type === 'opportunity' && <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {ins.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      {ins.type === 'warning' && <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />}
                      <span>{ins.title}</span>
                    </div>
                    {ins.route && (
                      <span className="px-1.5 py-0.5 rounded bg-white/80 font-mono text-[10px] uppercase font-bold shrink-0">
                        {ins.route}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] opacity-90 leading-relaxed">{ins.message}</p>
                  <div className="mt-2 text-[11px] font-semibold flex items-center gap-1 underline underline-offset-2">
                    <span>Action: {ins.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Simulator Banner */}
          <div className="mt-4 p-3 rounded-lg bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-sky-400">Optimize Price Elasticity</div>
              <div className="text-[11px] text-slate-300">Run what-if simulation to maximize yield</div>
            </div>
            <button
              onClick={() => setActiveTab('fare')}
              className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
