import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Download,
  Loader2,
  Table
} from 'lucide-react';

const REQUIRED_FIELDS = [
  { id: 'flight_number', label: 'Flight Number', desc: 'e.g. Flight No, Flight, AI-101, SW-204' },
  { id: 'origin', label: 'Origin Airport', desc: 'e.g. Origin, From, DEL, BOM, LHR' },
  { id: 'destination', label: 'Destination Airport', desc: 'e.g. Destination, To, BOM, DXB, JFK' },
  { id: 'booking_date', label: 'Booking Date', desc: 'e.g. Booking Date, Booked At, 2026-08-14' },
  { id: 'departure_date', label: 'Departure Date', desc: 'e.g. Travel Date, Flight Date, 2026-09-02' },
  { id: 'booking_class', label: 'Booking Class', desc: 'e.g. Cabin Class, Economy, Business' },
  { id: 'fare', label: 'Ticket Fare Amount', desc: 'e.g. Fare, Base Fare, Total Price, $120.00' },
];

const OPTIONAL_FIELDS = [
  { id: 'ticket_id', label: 'Ticket ID / Number', desc: 'e.g. Ticket ID, TK-AI-00012345' },
  { id: 'booking_reference', label: 'Booking Reference / PNR', desc: 'e.g. Booking ID, PNR, BK000456' },
  { id: 'passenger_name', label: 'Passenger Name', desc: 'e.g. Passenger Name, Aarav Sharma' },
  { id: 'status', label: 'Ticket Status', desc: 'e.g. Status, Confirmed, Cancelled, Refunded' },
  { id: 'sales_channel', label: 'Sales Channel', desc: 'e.g. Sales Channel, Direct Web, Mobile App, OTA' }
];

export default function UploadModal() {
  const { isUploadModalOpen, setIsUploadModalOpen, triggerRefresh } = useApp();

  const [step, setStep] = useState(1); // 1: Select File, 2: Column Mapping, 3: Validation & Import, 4: Results
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importResult, setImportResult] = useState(null);

  if (!isUploadModalOpen) return null;

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setError('');
    setLoading(true);

    try {
      const data = await api.previewUpload(selected);
      setPreviewData(data);
      // Initialize mappings with suggested mappings
      const initialMap = {};
      [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach((f) => {
        initialMap[f.id] = data.suggested_mapping[f.id] || '';
      });
      setColumnMapping(initialMap);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to inspect file');
    } finally {
      setLoading(false);
    }
  };

  const handleStartImport = async () => {
    // Validate required fields mapped
    const unmappedRequired = REQUIRED_FIELDS.filter((f) => !columnMapping[f.id]);
    if (unmappedRequired.length > 0) {
      setError(`Please map all required fields: ${unmappedRequired.map((f) => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.processUpload(file, columnMapping);
      setImportResult(res);
      setStep(4);
      triggerRefresh();
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setImportResult(null);
    setError('');
    setIsUploadModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Airline Dataset</h2>
              <p className="text-xs text-slate-500">Upload sales data via CSV or Excel with column verification</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-700'}`}>1</span>
            <span className={step === 1 ? 'text-sky-700 font-bold' : ''}>Select File</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-700'}`}>2</span>
            <span className={step === 2 ? 'text-sky-700 font-bold' : ''}>Column Mapping</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-700'}`}>3</span>
            <span className={step === 3 ? 'text-sky-700 font-bold' : ''}>Validation & Preview</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-700'}`}>4</span>
            <span className={step === 4 ? 'text-sky-700 font-bold' : ''}>Report Summary</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT FILE */}
          {step === 1 && (
            <div className="space-y-6 text-center py-8">
              <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-10 transition-colors bg-slate-50/50 flex flex-col items-center justify-center">
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">Upload CSV or Excel file</h3>
                <p className="text-xs text-slate-500 mb-4">Supported formats: .csv, .xlsx, .xls (up to 50 MB)</p>

                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-md shadow-sky-600/20 transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose File to Upload</span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {loading && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-sky-600 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing file structure and headers...</span>
                  </div>
                )}
              </div>

              {/* Sample Template Download */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 flex items-center justify-between text-left">
                <div>
                  <h4 className="text-xs font-bold text-sky-950">Need a sample airline dataset?</h4>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    Download our verified 5,000-record test CSV dataset containing multi-route booking transactions.
                  </p>
                </div>
                <a
                  href={api.getSampleTemplateUrl()}
                  download="sample_airline_data.csv"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-bold text-sky-700 hover:bg-sky-100 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV Template</span>
                </a>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>File: <strong className="text-slate-900">{file.name}</strong></span>
                <span>Detected Columns: <strong className="text-slate-900">{previewData.columns.length}</strong></span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Required Fields Mapping
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REQUIRED_FIELDS.map((f) => (
                    <div key={f.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>{f.label}</span>
                          <span className="text-rose-500">*</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{f.desc}</div>
                      </div>
                      <select
                        value={columnMapping[f.id] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [f.id]: e.target.value })}
                        className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1 max-w-[180px] focus:ring-1 focus:ring-sky-500 font-medium"
                      >
                        <option value="">-- Select Column --</option>
                        {previewData.columns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Optional Fields Mapping
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {OPTIONAL_FIELDS.map((f) => (
                    <div key={f.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-700">{f.label}</div>
                        <div className="text-[10px] text-slate-400">{f.desc}</div>
                      </div>
                      <select
                        value={columnMapping[f.id] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [f.id]: e.target.value })}
                        className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1 max-w-[180px] focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">-- Skip / Unmapped --</option>
                        {previewData.columns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW SAMPLES */}
          {step === 3 && previewData && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                Reviewing initial records with applied column mappings:
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      {REQUIRED_FIELDS.map((f) => (
                        <th key={f.id} className="p-2.5 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.preview.slice(0, 8).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {REQUIRED_FIELDS.map((f) => {
                          const col = columnMapping[f.id];
                          return (
                            <td key={f.id} className="p-2.5 whitespace-nowrap">
                              {col ? String(row[col] ?? '—') : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT REPORT SUMMARY */}
          {step === 4 && importResult && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Import Completed Successfully</h3>
              <p className="text-xs text-slate-500">
                Your uploaded dataset has been verified and ingested into the active database.
              </p>

              <div className="grid grid-cols-3 gap-3 text-left max-w-lg mx-auto mt-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Rows</div>
                  <div className="text-lg font-bold text-slate-800">{importResult.total_rows_processed}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-[10px] text-emerald-600 font-bold uppercase">Imported Valid</div>
                  <div className="text-lg font-bold text-emerald-700">{importResult.imported_count}</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-[10px] text-rose-600 font-bold uppercase">Rejected / Errors</div>
                  <div className="text-lg font-bold text-rose-700">{importResult.rejected_count}</div>
                </div>
              </div>

              {/* Rejected rows detail list */}
              {importResult.rejected_rows && importResult.rejected_rows.length > 0 && (
                <div className="mt-4 text-left max-w-2xl mx-auto border border-rose-200 rounded-xl bg-rose-50/40 p-4">
                  <h4 className="text-xs font-bold text-rose-900 mb-2">Rejected Rows Detail Report:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs text-rose-800">
                    {importResult.rejected_rows.map((r, i) => (
                      <div key={i} className="bg-white p-2 rounded-md border border-rose-100 flex items-start justify-between">
                        <div>
                          <strong>Row {r.row_number}</strong> (Ticket: {r.ticket_id})
                          <div className="text-[11px] text-rose-600">{r.errors.join('; ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step > 1 && step < 4 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {step < 3 && step > 1 && (
              <button
                onClick={() => setStep(3)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Next: Review Preview
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleStartImport}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Ingest Data</span>
              </button>
            )}

            {step === 4 && (
              <button
                onClick={resetModal}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
