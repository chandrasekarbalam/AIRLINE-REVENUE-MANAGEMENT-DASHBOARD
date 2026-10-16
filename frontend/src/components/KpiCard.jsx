import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Info, Minus } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  formattedValue,
  priorValue,
  changePct,
  calculation,
  icon: Icon,
  unit = '',
  invertPositive = false, // e.g. for cancellations, down is good
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const hasChange = changePct !== null && changePct !== undefined && !isNaN(changePct);
  const isZero = changePct === 0;
  const isPositive = invertPositive ? changePct < 0 : changePct > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-sky-600 transition-colors p-0.5"
              title="Calculation Details"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showTooltip && calculation && (
              <div className="absolute right-0 top-6 z-50 w-60 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl border border-slate-700 pointer-events-none leading-relaxed animate-in fade-in">
                <span className="font-bold text-sky-400 block mb-1">Formula & Method:</span>
                {calculation}
              </div>
            )}
          </div>
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {formattedValue !== undefined ? formattedValue : value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      {/* Footer / Comparison */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-2">
        {hasChange ? (
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${
                isZero
                  ? 'bg-slate-100 text-slate-600'
                  : isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isZero ? (
                <Minus className="w-3 h-3 mr-0.5" />
              ) : isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {changePct > 0 ? `+${changePct}%` : `${changePct}%`}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">vs prior period</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Prior comparison unavailable</span>
        )}

        {priorValue !== null && priorValue !== undefined && (
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Prev: {priorValue}
          </span>
        )}
      </div>
    </div>
  );
}
