import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Filter, RotateCcw, ChevronDown, ChevronUp, X, Calendar, Plane } from 'lucide-react';

export default function GlobalFilterBar() {
  const {
    filters,
    setFilter,
    resetFilters,
    filterOptions,
    activeFilterCount
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(true);

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    if (filters.endDate && newStart > filters.endDate) {
      setFilter('endDate', newStart);
    }
    setFilter('startDate', newStart);
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    if (filters.startDate && newEnd < filters.startDate) {
      setFilter('startDate', newEnd);
    }
    setFilter('endDate', newEnd);
  };

  // Active filter items for pills
  const activePills = [];
  if (filters.origin) activePills.push({ key: 'origin', label: `Origin: ${filters.origin}` });
  if (filters.destination) activePills.push({ key: 'destination', label: `Dest: ${filters.destination}` });
  if (filters.route) activePills.push({ key: 'route', label: `Route: ${filters.route}` });
  if (filters.flightNumber) activePills.push({ key: 'flightNumber', label: `Flight: ${filters.flightNumber}` });
  if (filters.bookingClass) activePills.push({ key: 'bookingClass', label: `Class: ${filters.bookingClass}` });
  if (filters.ticketStatus) activePills.push({ key: 'ticketStatus', label: `Status: ${filters.ticketStatus}` });
  if (filters.salesChannel) activePills.push({ key: 'salesChannel', label: `Channel: ${filters.salesChannel}` });
  if (filters.airline) activePills.push({ key: 'airline', label: `Airline: ${filters.airline}` });

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Toggle & Filter Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-sky-600 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Global Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-sky-100 text-sky-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Active Pills Display */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap ml-2">
            {activePills.map((pill) => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
              >
                {pill.label}
                <button
                  onClick={() => setFilter(pill.key, '')}
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Reset Filters Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 px-2 py-1 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Expanded Controls Grid with Explicit Examples */}
      {isExpanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
          {/* Quick Demo Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">Try Example:</span>
            <button
              type="button"
              onClick={() => { setFilter('route', 'DEL-BOM'); setFilter('origin', ''); setFilter('destination', ''); }}
              className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80 font-medium shrink-0 transition-colors"
            >
              Route: DEL-BOM (Delhi-Mumbai)
            </button>
            <button
              type="button"
              onClick={() => { setFilter('bookingClass', 'Business'); }}
              className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 font-medium shrink-0 transition-colors"
            >
              Cabin: Business Class Only
            </button>
            <button
              type="button"
              onClick={() => { setFilter('salesChannel', 'Direct Web'); }}
              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 font-medium shrink-0 transition-colors"
            >
              Channel: Direct Web
            </button>
            <button
              type="button"
              onClick={() => { setFilter('origin', 'DEL'); setFilter('destination', 'DXB'); }}
              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/80 font-medium shrink-0 transition-colors"
            >
              Sector: DEL → DXB (Dubai)
            </button>
            <button
              type="button"
              onClick={() => { setFilter('ticketStatus', 'Confirmed'); }}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 font-medium shrink-0 transition-colors"
            >
              Status: Confirmed Tickets
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 text-xs">
            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" title="Example: 2026-07-01">
                Start Date <span className="font-normal text-slate-400 text-[9px]">(e.g. 2026-07-01)</span>
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={handleStartDateChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" title="Example: 2026-10-15">
                End Date <span className="font-normal text-slate-400 text-[9px]">(e.g. 2026-10-15)</span>
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={handleEndDateChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Origin */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Origin <span className="font-normal text-slate-400 text-[9px]">(e.g. DEL)</span>
              </label>
              <select
                value={filters.origin}
                onChange={(e) => setFilter('origin', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Origins (e.g. DEL, BOM)</option>
                {filterOptions.airports?.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Destination <span className="font-normal text-slate-400 text-[9px]">(e.g. BOM)</span>
              </label>
              <select
                value={filters.destination}
                onChange={(e) => setFilter('destination', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Dests (e.g. BOM, DXB)</option>
                {filterOptions.airports?.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Route */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Route <span className="font-normal text-slate-400 text-[9px]">(e.g. DEL-BOM)</span>
              </label>
              <select
                value={filters.route}
                onChange={(e) => setFilter('route', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Routes (e.g. DEL-BOM)</option>
                {filterOptions.routes?.map((r) => (
                  <option key={r.route_code} value={r.route_code}>
                    {r.route_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Booking Class */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cabin <span className="font-normal text-slate-400 text-[9px]">(e.g. Business)</span>
              </label>
              <select
                value={filters.bookingClass}
                onChange={(e) => setFilter('bookingClass', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Cabins (e.g. Economy)</option>
                {filterOptions.booking_classes?.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ticket Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status <span className="font-normal text-slate-400 text-[9px]">(e.g. Confirmed)</span>
              </label>
              <select
                value={filters.ticketStatus}
                onChange={(e) => setFilter('ticketStatus', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Statuses (e.g. Confirmed)</option>
                {filterOptions.statuses?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Sales Channel */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Channel <span className="font-normal text-slate-400 text-[9px]">(e.g. Mobile App)</span>
              </label>
              <select
                value={filters.salesChannel}
                onChange={(e) => setFilter('salesChannel', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Channels (e.g. Direct Web)</option>
                {filterOptions.channels?.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>

            {/* Airline */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Airline <span className="font-normal text-slate-400 text-[9px]">(e.g. SkyWings)</span>
              </label>
              <select
                value={filters.airline}
                onChange={(e) => setFilter('airline', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value="">All Airlines (e.g. SkyWings)</option>
                {filterOptions.airlines?.map((al) => (
                  <option key={al} value={al}>{al}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
