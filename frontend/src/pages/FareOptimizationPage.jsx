import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Sliders,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Percent,
  Play,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function FareOptimizationPage() {
  const {
    currency,
    currencySymbol,
    formatCurrency,
    formatNumber,
    refreshKey
  } = useApp();

  const [recommendations, setRecommendations] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('DEL-BOM');
  const [fareChangePct, setFareChangePct] = useState(10);
  const [elasticity, setElasticity] = useState(-1.15);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    async function loadRecs() {
      setLoading(true);
      try {
        const recs = await api.getFareRecommendations(currency);
        setRecommendations(recs || []);
        if (recs && recs.length > 0 && !selectedRoute) {
          setSelectedRoute(recs[0].route_code);
        }
      } catch (err) {
        console.error('Failed to load fare recommendations', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecs();
  }, [refreshKey, currency]);

  // Run simulation whenever controls change
  useEffect(() => {
    async function runSim() {
      if (!selectedRoute) return;
      setSimulating(true);
      try {
        const res = await api.simulateFare({
          route_code: selectedRoute,
          fare_change_pct: Number(fareChangePct),
          elasticity: Number(elasticity),
          currency
        });
        setSimulationResult(res);
      } catch (e) {
        console.error('Simulation error', e);
      } finally {
        setSimulating(false);
      }
    }
    runSim();
  }, [selectedRoute, fareChangePct, elasticity, currency]);

  const sim = simulationResult?.simulation || {};
  const base = simulationResult?.baseline || {};
  const sensitivity = simulationResult?.sensitivity_curve || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Decision-Support What-If Pricing Simulator */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span>What-If Dynamic Pricing Simulator</span>
            </h2>
            <p className="text-xs text-slate-500">
              Model price elasticity of demand (\(E_d = \% \Delta Q / \% \Delta P\)) and physical seat constraints
            </p>
          </div>
          <span className="text-[11px] bg-sky-50 text-sky-800 font-bold px-2.5 py-1 rounded-md border border-sky-100">
            Decision Support Module
          </span>
        </div>

        {/* Simulator Controls & KPI Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Simulation Parameters
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Configure or pick scenario:</span>
            </div>

            {/* Quick Scenario Preset Chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => { setFareChangePct(12); setElasticity(-0.9); }}
                className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded border border-emerald-200 font-semibold transition-colors"
                title="Simulate Peak Surcharge (+12% price, inelastic demand -0.9)"
              >
                +12% Peak Surcharge
              </button>
              <button
                type="button"
                onClick={() => { setFareChangePct(5); setElasticity(-1.15); }}
                className="px-2 py-0.5 text-[10px] bg-sky-50 text-sky-800 hover:bg-sky-100 rounded border border-sky-200 font-semibold transition-colors"
                title="Simulate Moderate Yield Optimization (+5% price, standard elasticity -1.15)"
              >
                +5% Moderate Yield
              </button>
              <button
                type="button"
                onClick={() => { setFareChangePct(-10); setElasticity(-1.35); }}
                className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 rounded border border-amber-200 font-semibold transition-colors"
                title="Simulate Off-Peak Promo (-10% price, elastic demand -1.35)"
              >
                -10% Off-Peak Promo
              </button>
              <button
                type="button"
                onClick={() => { setFareChangePct(-20); setElasticity(-1.6); }}
                className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-800 hover:bg-rose-100 rounded border border-rose-200 font-semibold transition-colors"
                title="Simulate Flash Sale Discount (-20% price, highly elastic demand -1.6)"
              >
                -20% Flash Sale
              </button>
            </div>

            {/* Route Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Route <span className="font-normal text-slate-400 text-[10px]">(e.g. DEL-BOM, BOM-DXB)</span>
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500"
              >
                {recommendations.map((r) => (
                  <option key={r.route_code} value={r.route_code}>
                    {r.route_code} ({r.origin} → {r.destination}) - Base Fare: {formatCurrency(r.current_avg_fare)} | Load Factor: {r.load_factor}%
                  </option>
                ))}
              </select>
            </div>

            {/* Fare Adjustment Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Hypothetical Fare Adjustment</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  fareChangePct > 0 ? 'bg-emerald-100 text-emerald-800' : fareChangePct < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {fareChangePct > 0 ? `+${fareChangePct}%` : `${fareChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                step="1"
                value={fareChangePct}
                onChange={(e) => setFareChangePct(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
                <span>-30% (Promotional)</span>
                <span>0% (Baseline)</span>
                <span>+40% (Peak Premium)</span>
              </div>
            </div>

            {/* Price Elasticity of Demand (Ed) */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Price Elasticity (\(E_d\))</span>
                <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {elasticity}
                </span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="-0.4"
                step="0.05"
                value={elasticity}
                onChange={(e) => setElasticity(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
                <span>-2.0 (Highly Elastic)</span>
                <span>-1.15 (Standard)</span>
                <span>-0.4 (Inelastic Business)</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Mathematical Constraint:</strong> Seat inventory constraints limit sales to available aircraft capacity ({formatNumber(simulationResult?.capacity_constraint)} seats). Spillover demand cannot be boarded.
            </div>
          </div>

          {/* Side-by-side KPI Output (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Projected Fare */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Projected Fare</span>
                <span className="text-lg font-bold text-slate-900 block mt-1">{formatCurrency(sim.average_fare)}</span>
                <span className="text-[10px] text-slate-500">Base: {formatCurrency(base.average_fare)}</span>
              </div>

              {/* Projected Demand */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Boarded Demand</span>
                <span className="text-lg font-bold text-slate-900 block mt-1">{formatNumber(sim.tickets_sold)}</span>
                <span className="text-[10px] text-slate-500">Delta: {sim.tickets_delta > 0 ? `+${sim.tickets_delta}` : sim.tickets_delta}</span>
              </div>

              {/* Projected Load Factor */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Projected LF</span>
                <span className="text-lg font-bold text-slate-900 block mt-1">{sim.load_factor}%</span>
                <span className="text-[10px] text-slate-500">Base: {base.load_factor}%</span>
              </div>

              {/* Projected Revenue */}
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                <span className="text-[10px] font-bold uppercase text-sky-700 block">Projected Revenue</span>
                <span className="text-lg font-bold text-sky-950 block mt-1">{formatCurrency(sim.total_revenue)}</span>
                <span className={`text-[10px] font-bold block ${sim.revenue_delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {sim.revenue_delta >= 0 ? `+${formatCurrency(sim.revenue_delta)}` : formatCurrency(sim.revenue_delta)} ({sim.revenue_delta_pct > 0 ? `+${sim.revenue_delta_pct}%` : `${sim.revenue_delta_pct}%`})
                </span>
              </div>
            </div>

            {/* Price Sensitivity Curve */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Price Sensitivity Curve (Revenue Optimization Curve)
                </h4>
                <span className="text-[10px] text-slate-400">Optimal Revenue Peak</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensitivity} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="fare_change_pct"
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        name === 'Projected Revenue' ? formatCurrency(val) : `${val}%`,
                        name
                      ]}
                      labelFormatter={(l) => `Fare Adjustment: ${l}%`}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="projected_revenue"
                      name="Projected Revenue"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Automated Decision-Support Fare Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Decision-Support Fare Adjustments</h3>
          <p className="text-xs text-slate-500">
            Algorithmic pricing advisory derived from load factor pacing and historic demand elasticity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 6).map((rec) => (
            <div
              key={rec.route_code}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between text-xs ${
                rec.tag === 'increase'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : rec.tag === 'decrease'
                  ? 'border-amber-200 bg-amber-50/40'
                  : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">{rec.route_code}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      rec.tag === 'increase'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.tag === 'decrease'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {rec.recommendation}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Avg Fare</span>
                    <strong>{formatCurrency(rec.current_avg_fare)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Load Factor</span>
                    <strong className={rec.load_factor >= 85 ? 'text-emerald-700' : ''}>{rec.load_factor}%</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200/80 mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Suggested Action:</span>
                  <span className="font-bold text-sky-900 text-xs">{rec.suggested_adjustment}</span>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{rec.explanation}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>Confidence: <strong>{rec.confidence}</strong></span>
                <button
                  onClick={() => {
                    setSelectedRoute(rec.route_code);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  <span>Simulate Route</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Disclaimer:</strong> Recommendations provide algorithmic decision support. Airline revenue analysts should account for competitor schedule filings and strategic commercial agreements before committing yield changes.
          </span>
        </div>
      </div>
    </div>
  );
}
