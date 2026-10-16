import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Download, FileSpreadsheet, FileText, X, CheckCircle } from 'lucide-react';

const reportOptions = [
  { id: 'revenue_summary', name: 'Revenue Summary Report', desc: 'KPI totals, period comparisons, RASK and yield metrics' },
  { id: 'route_performance', name: 'Route Network Performance', desc: 'Route rankings, seat utilization, distance and revenue' },
  { id: 'flight_performance', name: 'Flight-Level Operations', desc: 'Individual flight dates, capacities, load factor and status' },
  { id: 'ticket_sales', name: 'Ticket Transactions', desc: 'Granular ticket ledger with passenger details and channels' },
  { id: 'class_breakdown', name: 'Booking Class Breakdown', desc: 'Economy, Premium, Business and First class distributions' },
  { id: 'forecast', name: 'Revenue Forecast Projection', desc: 'Forward 30-day forecast values with 95% confidence intervals' }
];

export default function ExportModal() {
  const { isExportModalOpen, setIsExportModalOpen, getFilterParams, currency } = useApp();

  const [selectedReport, setSelectedReport] = useState('revenue_summary');
  const [selectedFormat, setSelectedFormat] = useState('csv'); // 'csv' or 'excel'

  if (!isExportModalOpen) return null;

  const handleDownload = () => {
    const params = getFilterParams();
    const url = api.getExportUrl(selectedReport, selectedFormat, params);
    window.open(url, '_blank');
    setIsExportModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Export Airline Report</h2>
              <p className="text-xs text-slate-500">Download formatted operational and financial data in {currency}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Report Type
            </label>
            <div className="space-y-2">
              {reportOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedReport(opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    selectedReport === opt.id
                      ? 'border-sky-500 bg-sky-50/50 text-sky-950 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                  {selectedReport === opt.id && (
                    <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <FileText className="w-5 h-5 text-sky-600" />
                <div className="text-left text-xs">
                  <div>CSV File</div>
                  <div className="text-[10px] text-slate-500">Universal tabular format</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('excel')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div className="text-left text-xs">
                  <div>Excel Workbook</div>
                  <div className="text-[10px] text-slate-500">.xlsx with sheet headers</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
