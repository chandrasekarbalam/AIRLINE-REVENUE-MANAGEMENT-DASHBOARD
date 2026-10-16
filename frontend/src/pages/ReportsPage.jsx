import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Table,
  UploadCloud,
  FileCheck
} from 'lucide-react';

const reportCards = [
  {
    id: 'revenue_summary',
    title: 'Revenue Summary Report',
    desc: 'Executive KPI performance, period-over-period percentage growth, RASK, yield and booking conversion rate metrics.',
    badge: 'Executive Level'
  },
  {
    id: 'route_performance',
    title: 'Route Network Performance Report',
    desc: 'Comprehensive route rankings, seat utilization, distance, average fare, and route-level revenue benchmarks.',
    badge: 'Commercial Strategy'
  },
  {
    id: 'flight_performance',
    title: 'Flight Operations Performance Report',
    desc: 'Flight-by-flight operational log with aircraft types, seat capacities, seats booked, load factors and revenue.',
    badge: 'Flight Operations'
  },
  {
    id: 'ticket_sales',
    title: 'Ticket Sales & Transaction Ledger',
    desc: 'Granular ticket records including passenger identities, booking references, classes, taxes, discounts, and sales channels.',
    badge: 'Revenue Accounting'
  },
  {
    id: 'class_breakdown',
    title: 'Cabin Class Revenue Distribution',
    desc: 'Segmented financial analysis across Economy, Premium Economy, Business, and First Class cabins.',
    badge: 'Product & Pricing'
  },
  {
    id: 'forecast',
    title: 'Revenue Forecast Projection Report',
    desc: '30-day time-series projections with upper and lower 95% confidence intervals and chronological holdout validation metrics.',
    badge: 'Planning & Forecasting'
  }
];

export default function ReportsPage() {
  const {
    getFilterParams,
    currency,
    filters,
    setIsUploadModalOpen
  } = useApp();

  const [downloading, setDownloading] = useState(null);

  const handleExport = (reportId, format) => {
    setDownloading(`${reportId}_${format}`);
    const params = getFilterParams();
    const url = api.getExportUrl(reportId, format, params);
    window.open(url, '_blank');
    setTimeout(() => setDownloading(null), 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Report Center Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Airline Financial & Operational Report Center</span>
          </h2>
          <p className="text-xs text-slate-500">
            Generate and export reconciled reports respecting active filters and current currency ({currency})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getSampleTemplateUrl()}
            download="sample_airline_data.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV Sample</span>
          </a>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Dataset</span>
          </button>
        </div>
      </div>

      {/* 2. Active Scope Indicator */}
      <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-sky-900">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-sky-600" />
          <span>Active Export Scope: <strong>{filters.startDate} to {filters.endDate}</strong> in <strong>{currency}</strong></span>
        </div>
        <span className="text-[11px] text-sky-700">
          All exported ledger totals reconcile identically with the dashboard analytical calculations.
        </span>
      </div>

      {/* 3. Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportCards.map((rc) => (
          <div
            key={rc.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {rc.badge}
                </span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">{rc.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{rc.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleExport(rc.id, 'csv')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => handleExport(rc.id, 'excel')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
